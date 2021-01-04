declare class Wallstick {
    Set(part : BasePart | undefined, normal? : Vector3, teleportCFrame? : CFrame) : void
    Destroy() : void
    constructor(player : Player)
}

export = Wallstick