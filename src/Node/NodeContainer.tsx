import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { NodeData } from "../utils/types";
import { NodeTypeSwitcher } from "./NodeTypeSwitcher";
import styles from "./NodeContainer.module.css";

type NodeContainerProps = {
    node: NodeData;
    updateFocusedIndex(index: number): void;
    isFocused: boolean;
    index: number;
};

export const NodeContainer = ({ node, index, isFocused, updateFocusedIndex }: NodeContainerProps) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: node.id
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div 
        ref={setNodeRef}
        style={style}
        className={styles.container}
        {...attributes}
        >
           <div {...listeners} className={styles.dragHandle}>
             ⠿
            </div> 
            <NodeTypeSwitcher 
                node={node}
                index={index}
                isFocused={isFocused}
                updateFocusedIndex={updateFocusedIndex}
            />
        </div>
    )
}
