import * as Roact from "@rbxts/roact"
import abbreviate from "@rbxts/abbreviate"

type Props = {
    velocity: number
}

const abbreviator = abbreviate()
abbreviator.setSetting('decimalPlaces', 0);

const VelocityIndicator = (props : Props) => {

    let velString = abbreviator.numberToString(props.velocity)

    if (velString.size() < 2) velString = "0"+velString

    return <frame
        AnchorPoint = {new Vector2(0,1)}
        BackgroundTransparency = {0.7} 
        BackgroundColor3 = {new Color3(0.2,0.2,0.2)}
        BorderSizePixel = {0}
        Size = {new UDim2(0,0,.1,0)}
        Position = {new UDim2(0.75,10,0.9,0)}>
            <textlabel
                BackgroundTransparency = {1}
                Size = {new UDim2(1,0,1,0)}
                BorderSizePixel = {0}
                TextScaled = {true}
                Text = {velString}
                Font = {Enum.Font.SciFi}
                TextColor3 = {new Color3(1,1,1)}>
            </textlabel>
            <uiaspectratioconstraint 
                AspectRatio = {1} 
                DominantAxis = {Enum.DominantAxis.Height} 
                AspectType = {Enum.AspectType.ScaleWithParentSize}>
            
            </uiaspectratioconstraint>
    </frame>
}

export = VelocityIndicator