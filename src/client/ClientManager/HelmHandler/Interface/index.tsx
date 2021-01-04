import * as Roact from "@rbxts/roact"
import RudderIndicator from "client/ClientManager/HelmHandler/Interface/RudderIndicator"
import VelocityIndicator from "./VelocityIndicator"
import ThrottleIndicator from "./ThrottleIndicator"

type Props = {
    rudderPercent: number
    velocity: number
    throttle:number
}

const helmGUI = (props : Props) => {
    return <screengui>
        <RudderIndicator rudderPercent = {props.rudderPercent}></RudderIndicator>
        <VelocityIndicator velocity = {props.velocity}></VelocityIndicator>
        <ThrottleIndicator throttle = {props.throttle}></ThrottleIndicator>
    </screengui>
}

export = helmGUI