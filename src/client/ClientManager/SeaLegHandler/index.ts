import { ContextActionService, Players, RunService, Workspace } from "@rbxts/services"
import Wallstick from "shared/Wallstick"

const Player = Players.LocalPlayer

const SeaLegRaycastParams = new RaycastParams()
SeaLegRaycastParams.IgnoreWater = true
SeaLegRaycastParams.FilterType = Enum.RaycastFilterType.Blacklist

const GetShipMainPart = (Part : BasePart | Model) : BasePart | undefined => {
    let Ship = Part.FindFirstAncestorWhichIsA("Model")
    if (!Ship) return
    const mainPart = Ship.FindFirstChild("mainPart")
    if (mainPart && mainPart.IsA("BasePart")) return mainPart
    return GetShipMainPart(Ship)
}

const HandleSeaLegs = () => {
    let SeaLegs : Wallstick
    let RaycastingConnection : RBXScriptConnection
    let currentMain : BasePart | undefined

    Player.CharacterAdded.Connect(char=>{
        const HRP = char.WaitForChild("HumanoidRootPart")

        const CharBlacklist = char.GetDescendants()

        SeaLegRaycastParams.FilterDescendantsInstances = CharBlacklist

        if (!HRP.IsA("BasePart")) return
        RaycastingConnection = RunService.Stepped.Connect(()=>{

            const RayCast = Workspace.Raycast(HRP.Position,new Vector3(0,-1,0).mul(50),SeaLegRaycastParams)
            if (!RayCast) {
                if (SeaLegs) SeaLegs.Destroy()
                if (currentMain) {
                    spawn(()=>{
                        ContextActionService.BindAction("SpaceInhibitor",()=>{},false,Enum.KeyCode.Space)
                        wait(1)
                        ContextActionService.UnbindAction("SpaceInhibitor")
                    })
                }
                currentMain = undefined
                return
            }
            const HitPart = RayCast.Instance
            let Ship = GetShipMainPart(HitPart)
            if (!Ship) {
                if (SeaLegs) SeaLegs.Destroy()
                if (currentMain) {
                    spawn(()=>{
                        ContextActionService.BindAction("SpaceInhibitor",()=>{},false,Enum.KeyCode.Space)
                        wait(1)
                        ContextActionService.UnbindAction("SpaceInhibitor")
                    })
                }
                currentMain = undefined
                return
            }
            if (currentMain === Ship) return
            SeaLegs = new Wallstick(Player)
            SeaLegs.Set(Ship,new Vector3(0,1,0))
            currentMain = Ship
            spawn(()=>{
                ContextActionService.BindAction("SpaceInhibitor",()=>{},false,Enum.KeyCode.Space)
                wait(1)
                ContextActionService.UnbindAction("SpaceInhibitor")
            })
        })

    })
    
    Player.CharacterRemoving.Connect(()=>{
        if (SeaLegs) SeaLegs.Destroy()
        if (RaycastingConnection) RaycastingConnection.Disconnect()
    })

}

export = HandleSeaLegs