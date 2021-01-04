import * as Roact from "@rbxts/roact"

type Props = {
    rudderPercent: number
}

const RudderIndicator = (props : Props) : Roact.Element => {

    const indicatorLocation = -props.rudderPercent/2 + 0.5 

    return <frame 
        AnchorPoint = {new Vector2(0.5,1)} 
        Size = {new UDim2(0.5,0,0.1,0)} 
        Position = {new UDim2(0.5,0,0.9,0)} 
        BackgroundTransparency = {0.7} 
        BackgroundColor3 = {new Color3(0.2,0.2,0.2)}
        BorderSizePixel = {0}>
            <imagelabel 
                Size = {new UDim2(0,10,1,0)} 
                Position = {new UDim2(indicatorLocation,0,0,0)} 
                BorderSizePixel = {0}
                BackgroundTransparency = {0}
                BackgroundColor3 = {new Color3(1,1,1)}
                ImageTransparency = {0}>
            </imagelabel>
    </frame>
}

export = RudderIndicator