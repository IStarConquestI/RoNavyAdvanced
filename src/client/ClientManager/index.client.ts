import {Players, Workspace} from "@rbxts/services"
import { handleHelm } from "./HelmHandler"
import HandleSeaLegs from "./SeaLegHandler"

const player = Players.LocalPlayer

HandleSeaLegs()

Workspace.GetDescendants().forEach((descendant) => {
    if (descendant.Name === "helm" && descendant.IsA("Seat")) {
        handleHelm(descendant)
    }
})

Workspace.DescendantAdded.Connect((descendant) => {
    if (descendant.Name === "helm" && descendant.IsA("Seat")) {
        handleHelm(descendant)
    }
})