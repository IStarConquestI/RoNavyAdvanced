import {ReplicatedStorage, RunService, ServerStorage, Workspace, Players} from '@rbxts/services';
import {Tween, PseudoTween} from "@rbxts/tween"
import {Standard,InOutSine, Linear} from "@rbxts/easing-functions"
import Settings from "server/ShipManager/Settings";

const ships = ServerStorage.FindFirstChild('Ships');

const bigForce = 99999999999999;

export type statistics = {
    integrity: number
    maxVelocity: number
    maxReversePercent: number
    zeroToFullTime: number

    maxTurnRate: number
    rudderShiftTime: number

    rollAngle: number
    rollTime: number
}

export enum RudderDirection{"LEFT", "RIGHT", "CENTER"}

const makeUUID = () => {
    const template ='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    return template.gsub('[xy]',  (c) => {
        const v = (c === 'x') ? math.random(0, 0xf) : math.random(8, 0xb)
        return '%x'.format(v)
    })
}

const weld = (mainPart : BasePart) => (toWeld : Instance) => {
    if (toWeld.IsA('BasePart')) {
        const weld = new Instance('WeldConstraint');
        weld.Part0 = mainPart;
        weld.Part1 = toWeld;
        weld.Parent = toWeld;
        toWeld.Anchored = false;
    };

    toWeld.GetChildren().forEach(descendant=>{
        weld(mainPart)(descendant);
    });

    mainPart.Anchored = false;
};

export class Ship {

    mainPart: BasePart;
    model: Model;
    statistics: statistics;
    spawned: boolean;
    UUID: string
    helm: Seat

    bodyPosition: BodyPosition;
    bodyGyro: BodyGyro
    bodyAngularVelocity: BodyAngularVelocity;
    bodyVelocity: BodyVelocity;



    integrity: number;
    velocity: number;
    targetVelocity: number;
    maxVelocity: number;
    rudderPosition: number;
    rudderDirection: RudderDirection;
    rollAngle: number;

    rudderTween?: PseudoTween;
    velocityTween?: PseudoTween

    ShipRemote: RemoteEvent

    constructor(name : string) {

        assert(ships, 'failed to find ships folder');

        const ship = ships.FindFirstChild(name);
        assert(ship, 'failed to find '+name+' in ships');
        const model = ship.FindFirstChildOfClass('Model');
        assert(model, 'failed to find model for '+name);
        this.model = model.Clone();



        const mainPart = this.model.FindFirstChild('mainPart');
        assert(mainPart && mainPart.IsA('BasePart'), 'ship is missing main part');
        this.mainPart = mainPart;

        this.model.PrimaryPart = this.mainPart

        const statistics = ship.FindFirstChild('Statistics');
        assert(statistics && statistics.IsA('ModuleScript'), "could not find statistics for "+name);
        this.statistics = require(statistics) as statistics;

        const helm = this.model.FindFirstChild("helm")
        assert(helm && helm.IsA("Seat"), "failed to find seat on "+name)
        this.helm = helm

        this.UUID = makeUUID()[0]
        this.model.Name = this.UUID

        this.bodyPosition = new Instance('BodyPosition');
        this.bodyPosition.Position = new Vector3(0,Settings.waterLevel,0);
        this.bodyPosition.MaxForce = new Vector3(0,bigForce,0);
        this.bodyPosition.Parent = this.mainPart;

        this.bodyGyro = new Instance('BodyGyro');
        this.bodyGyro.CFrame = new CFrame(0,0,0);
        this.bodyGyro.MaxTorque = new Vector3(bigForce,0,bigForce);
        this.bodyGyro.Parent = this.mainPart;

        this.bodyAngularVelocity = new Instance('BodyAngularVelocity');
        this.bodyAngularVelocity.AngularVelocity = new Vector3(0,0,0);
        this.bodyAngularVelocity.MaxTorque = new Vector3(0,bigForce,0);
        this.bodyAngularVelocity.Parent = this.mainPart;

        this.bodyVelocity = new Instance('BodyVelocity');
        this.bodyVelocity.Velocity = new Vector3(0,0,0);
        this.bodyVelocity.MaxForce = new Vector3(bigForce,0,bigForce);
        this.bodyVelocity.Parent = this.mainPart;

        this.ShipRemote = new Instance("RemoteEvent")
        this.ShipRemote.Name = this.UUID
        this.ShipRemote.Parent = ReplicatedStorage

        this.velocity = 0;
        this.rudderPosition = 0;
        this.maxVelocity = this.statistics.maxVelocity;
        this.integrity = this.statistics.integrity;
        this.rudderDirection = RudderDirection.CENTER;
        this.rollAngle = 0;
        this.targetVelocity = 0

        this.spawned = false

        this.ShipRemote.OnServerEvent.Connect((client, header, data) => {
            if (header === "changeRudderDirection" && this.isHelmsman(client)) {
                if (data === "CENTER") this.changeRudderTarget(RudderDirection.CENTER)
                if (data === "RIGHT") this.changeRudderTarget(RudderDirection.RIGHT)
                if (data === "LEFT") this.changeRudderTarget(RudderDirection.LEFT)
            } else if (header === "changeTargetThrottle" && this.isHelmsman(client) && typeIs(data,"number")){
                this.changeVelocity(math.clamp(data,-this.statistics.maxReversePercent,1))
            } else if (header === "updateHelmData") {
                this.transmitToHelmsman("newVelocity")(this.velocity)
                this.transmitToHelmsman("newRudderPosition")(this.rudderPosition)
                this.transmitToHelmsman("newThrottle")(this.targetVelocity/this.maxVelocity)
            } else if (header === "getShipStatistics") {
                this.transmitToClient(client)("shipStatistics")({
                    UUID: this.UUID,
                    statistics: this.statistics
                })
            }
        })

        RunService.Stepped.Connect(()=>{
            if (this.bodyAngularVelocity.AngularVelocity.Magnitude > 0) this.updateVelocity()
        })

        if (Settings.roll) {
            spawn(() => {
                Tween(this.statistics.rollTime/2,InOutSine,(x)=>{
                    this.rollAngle = x
                    this.updateRoll()
                },0,this.statistics.rollAngle).Wait()
                while (true) {
                    Tween(this.statistics.rollTime,InOutSine,(x)=>{
                        this.rollAngle = x
                        this.updateRoll()
                    },this.statistics.rollAngle,-this.statistics.rollAngle).Wait()
                    Tween(this.statistics.rollTime,InOutSine,(x)=>{
                        this.rollAngle = x
                        this.updateRoll()
                    },-this.statistics.rollAngle,this.statistics.rollAngle).Wait()
                }
            })
        }
    };

    spawn = (location : CFrame) => {
        this.model.SetPrimaryPartCFrame(location)
        this.model.Parent = Workspace;
        weld(this.mainPart)(this.model);
        this.spawned = true;
    };

    changeVelocity = (newVelocityPercent : number) => {

        this.transmitToHelmsman("newThrottle")(newVelocityPercent)
        this.targetVelocity = this.maxVelocity * newVelocityPercent;
        if (this.velocityTween) this.velocityTween.Cancel()

        const tweenTime = this.statistics.zeroToFullTime*math.abs(this.velocity-this.targetVelocity)/this.maxVelocity

        this.velocityTween = Tween(tweenTime, Linear, (newVelocity)=>{
            this.velocity = newVelocity;
            this.transmitToHelmsman("newVelocity")(newVelocity)
            this.updateVelocity();
        },this.velocity,this.targetVelocity)
    };

    changeRudderTarget = (newRudderTarget : RudderDirection) => {
        this.rudderDirection = newRudderTarget;
        this.shiftRudder();
    };

    isHelmsman = (client : Player) => {
        const helmsman = this.helm.Occupant
        if (!helmsman) return false
        const player = Players.GetPlayerFromCharacter(helmsman.Parent)
        if (!player) return false
        if (player === client) return true
        return false
    }

    private updateRoll() {
        const dir = this.mainPart.CFrame.LookVector
        const rollVector = dir.mul(this.rollAngle)
        this.bodyGyro.CFrame = CFrame.Angles(rollVector.X, 0, rollVector.Z)
    }

    private updateVelocity() {
        const dir = this.mainPart.CFrame.LookVector;
        const velVector = dir.mul(this.velocity);
        this.bodyVelocity.Velocity = velVector;
    };

    private shiftRudder() {

        if (this.rudderTween) this.rudderTween.Cancel()

        let target = 0;
        if (this.rudderDirection === RudderDirection.LEFT) target = 1;
        if (this.rudderDirection === RudderDirection.RIGHT) target = -1;

        const tweenTime = this.statistics.rudderShiftTime*math.abs(this.rudderPosition-target)

        this.rudderTween = Tween(tweenTime, Linear, (newRudderPosition)=>{
            this.rudderPosition = newRudderPosition;
            this.transmitToHelmsman("newRudderPosition")(newRudderPosition)
            this.bodyAngularVelocity.AngularVelocity = new Vector3(0,this.rudderPosition*this.statistics.maxTurnRate,0);
        }, this.rudderPosition,target);
    };

    private transmitToClient = (client: Player) => (header: string) => (data: any) => {
        this.ShipRemote.FireClient(client,header,data)
    }

    private transmitToAll = (header : string) => (data:any) => {
        this.ShipRemote.FireAllClients(header,data)
    }

    private transmitToHelmsman = (header : string) => (data: any) => {
        const helmsman = this.helm.Occupant
        if (!helmsman) return
        const player = Players.GetPlayerFromCharacter(helmsman.Parent)
        if (!player) return
        this.transmitToClient(player)(header)(data)
    }

};