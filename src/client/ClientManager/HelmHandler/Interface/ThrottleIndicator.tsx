import * as Roact from "@rbxts/roact"
import abbreviate from "@rbxts/abbreviate"

type Props = {
    throttle: number
}

const abbreviator = abbreviate()
abbreviator.setSetting('decimalPlaces', 0);

const ThrottleIndicator = (props : Props) => {

    let throttleString = abbreviator.numberToString(props.throttle*100) + "%"

    if (throttleString.size() === 2) throttleString = "  "+throttleString
    if (throttleString.size() === 3) throttleString = " "+throttleString

    return <frame
        AnchorPoint = {new Vector2(1,1)}
        BackgroundTransparency = {0.7} 
        BackgroundColor3 = {new Color3(0.2,0.2,0.2)}
        BorderSizePixel = {0}
        Size = {new UDim2(0,0,.1,0)}
        Position = {new UDim2(0.25,-10,0.9,0)}>
            <textlabel
                BackgroundTransparency = {1}
                Size = {new UDim2(1,0,1,0)}
                BorderSizePixel = {0}
                TextScaled = {true}
                Text = {throttleString}
                Font = {Enum.Font.SciFi}
                TextColor3 = {new Color3(1,1,1)}>
            </textlabel>
            <uiaspectratioconstraint 
                AspectRatio = {1.5} 
                DominantAxis = {Enum.DominantAxis.Height} 
                AspectType = {Enum.AspectType.ScaleWithParentSize}>
            
            </uiaspectratioconstraint>
    </frame>
}

export = ThrottleIndicator