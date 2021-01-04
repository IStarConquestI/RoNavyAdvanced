import { Players, StarterPlayer, Workspace } from "@rbxts/services";

export function InitiateCamera(ship : Model) {
        const camera = Workspace.CurrentCamera
        const mainPart = ship.FindFirstChild("mainPart")
        if (!mainPart || !mainPart.IsA("BasePart")) return
        if (!camera) return
        camera.CameraSubject = mainPart
        
        const BoundingBoxSize = ship.GetBoundingBox()[1]

        let LongAxis = BoundingBoxSize.X
        if (LongAxis < BoundingBoxSize.Y) LongAxis = BoundingBoxSize.Y
        if (LongAxis < BoundingBoxSize.Z) LongAxis = BoundingBoxSize.Z

        Players.LocalPlayer.CameraMaxZoomDistance = LongAxis * 1.2
        Players.LocalPlayer.CameraMinZoomDistance = LongAxis / 3
}


export function StopCamera() {
    const camera = Workspace.CurrentCamera
    if (!camera) return

    const char = Players.LocalPlayer.Character
    if(!char) return
    const humanoid = char.FindFirstChildOfClass("Humanoid")
    if (!humanoid) return

    camera.CameraSubject = humanoid

    Players.LocalPlayer.CameraMaxZoomDistance = StarterPlayer.CameraMaxZoomDistance
    Players.LocalPlayer.CameraMinZoomDistance = StarterPlayer.CameraMinZoomDistance
    
}