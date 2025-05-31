import React, { useEffect, useState, Dispatch } from "react";
import { NodeData } from "../utils/types"

type UseFocusedNodeIndexProps = {
    nodes: NodeData[];
    commandPanelRef: React.RefObject<HTMLDivElement>;
}

export const useFocusedNodeIndex = ({ nodes, commandPanelRef }: UseFocusedNodeIndexProps): [number, Dispatch<number>] => {
    const [ focusedNodeIndex, setFocusedNodeIndex ] = useState(0);

    useEffect(() => {
        if (!nodes || !commandPanelRef) return;
        const onKeyDown = (event: KeyboardEvent)  => {

            const isCommandPanelFocused = commandPanelRef.current === document.activeElement;

            if (!isCommandPanelFocused) {
                if (event.key === "ArrowUp") {
                    setFocusedNodeIndex(index => Math.max(index - 1, 0))
                } else if (event.key === "ArrowDown") {
                    setFocusedNodeIndex(index => Math.min(index + 1, nodes.length - 1))
                }
            }
        }
        document.addEventListener("keydown", onKeyDown)

        return () => {
            document.removeEventListener("keydown", onKeyDown)
        }
    }, [nodes, commandPanelRef])

    return [ focusedNodeIndex, setFocusedNodeIndex ]
}