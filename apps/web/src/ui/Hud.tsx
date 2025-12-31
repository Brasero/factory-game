import {useSelector} from "react-redux";

export function Hud() {
    const iron = useSelector(state => state.game.resources.iron);
    const tick = useSelector(state => state.game.tick);

    return (
        <div id={"hud_container"}>
            <div id={"hud_resources"}>Fer : {iron}</div>
            <div id={"hud_tick"}>Temps : {tick}s</div>
        </div>
    )
}