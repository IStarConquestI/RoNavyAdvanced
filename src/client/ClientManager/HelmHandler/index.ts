import {Players, ReplicatedStorage,ContextActionService} from '@rbxts/services'
import {Tween, PseudoTween} from "@rbxts/tween"
import {Linear} from "@rbxts/easing-functions"
import helmGUI from "client/ClientManager/HelmHandler/Interface"
import * as Roact from "@rbxts/roact"
import { InitiateCamera, StopCamera } from './Camera'


const timeToFullThrottle = 2

export const handleHelm = (helm : Seat) => {
    let velocity = 0
    let rudder = 0
    let throttle = 0

    const ship = helm.Parent as Instance

    const shipEvent = ReplicatedStorage.FindFirstChild(ship.Name) as RemoteEvent

    let helmInterface: Roact.ComponentInstanceHandle | undefined

    let shipEventListener: RBXScriptConnection | undefined

    let velTween : PseudoTween

    const inputHandler = (actionName : string, inputState : Enum.UserInputState, inputObject : InputObject) => {
        if (!shipEvent) return

        if (inputState === Enum.UserInputState.Begin) {
            if (inputObject.KeyCode === Enum.KeyCode.A) {
                shipEvent.FireServer("changeRudderDirection","LEFT")
            } else if (inputObject.KeyCode === Enum.KeyCode.D) {
                shipEvent.FireServer("changeRudderDirection","RIGHT")
            } else if (inputObject.KeyCode === Enum.KeyCode.W) {
                if (velTween) velTween.Cancel()
                const tweenTime = math.abs(1-throttle)*timeToFullThrottle
                velTween = Tween(tweenTime, Linear, (newVel) => {
                    shipEvent.FireServer("changeTargetThrottle",newVel)
                },throttle,1)
            } else if (inputObject.KeyCode === Enum.KeyCode.S) {
                if (velTween) velTween.Cancel()
                const tweenTime = math.abs(-1-throttle)*timeToFullThrottle
                velTween = Tween(tweenTime, Linear, (newVel) => {
                    shipEvent.FireServer("changeTargetThrottle",newVel)
                },throttle,-1)
            } else if (inputObject.KeyCode === Enum.KeyCode.X) {
                shipEvent.FireServer("changeTargetThrottle",0)
            }
        } else if (inputObject.KeyCode === Enum.KeyCode.A || inputObject.KeyCode === Enum.KeyCode.D) {
            shipEvent.FireServer("changeRudderDirection", "CENTER")
        } else if (inputObject.KeyCode === Enum.KeyCode.W || inputObject.KeyCode === Enum.KeyCode.S) {
            if (velTween) velTween.Cancel()
        }
    }

    const dismount = () => {
        if (helmInterface) Roact.unmount(helmInterface)
        if (shipEventListener) {shipEventListener.Disconnect()
            ContextActionService.UnbindAction("ControlShip")}
        helmInterface = undefined
        shipEventListener = undefined
        StopCamera()
    }

    helm.GetPropertyChangedSignal('Occupant').Connect(()=>{

        const humanoid = helm.Occupant
        if (!humanoid) {
            dismount()
            return
        }
        const player = Players.GetPlayerFromCharacter(humanoid.Parent)
        if (!player) {
            dismount()
            return
        }
        if (player !== Players.LocalPlayer) {
            dismount()
            return
        }

        InitiateCamera(helm.Parent as Model)

        shipEventListener = shipEvent.OnClientEvent.Connect((header : unknown, data : unknown) => {
            if (header === "newRudderPosition") rudder = data as number
            if (header === "newVelocity") velocity = data as number
            if (header === "newThrottle") throttle = data as number
            if (helmInterface) helmInterface = Roact.update(helmInterface, helmGUI({rudderPercent: rudder, velocity: velocity, throttle: throttle}))
        })

        shipEvent.FireServer("updateHelmData")

        helmInterface = Roact.mount(helmGUI({rudderPercent: rudder, velocity: velocity, throttle: throttle}),Players.LocalPlayer.FindFirstChild('PlayerGui'))

        ContextActionService.BindAction("ControlShip",inputHandler,false,Enum.KeyCode.A,Enum.KeyCode.D,Enum.KeyCode.W,Enum.KeyCode.S, Enum.KeyCode.X)

    })
}