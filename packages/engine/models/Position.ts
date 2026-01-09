export interface Position {
    x: number;
    y: number;
}

export function isPositionType(entity: unknown): entity is Position {
    return (
        "x" in entity &&
        "y" in entity &&
        Object.keys(entity).length == 2
    )
}