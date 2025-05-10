import { FormEventHandler, KeyboardEventHandler, useEffect, useRef } from "react";
import { NodeData, NodeType } from "../utils/types";
import styles from "./Node.module.css"
import { nanoid } from "nanoid";
import { useAppState } from "../state/AppStateContext";
import { CommandPanel } from "./CommandPanel";
import cx from "classnames";

type BasicNodeProps = {
    node: NodeData;
    updateFocusedIndex(index: number): void;
    isFocused: boolean;
    index: number;
}

export const BasicNode = ({
    node,
    updateFocusedIndex,
    isFocused,
    index,
}: BasicNodeProps) => {
    const nodeRef = useRef<HTMLDivElement>(null);
    const showCommandPanel = isFocused && node?.value?.match(/^\//);

    const placeCaretAtEnd = (el: HTMLElement) => {
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
        }
    };    

    const { changeNodeValue, changeNodeType, removeNodeByIndex, addNode } = useAppState();
    useEffect(() => {
        if (nodeRef.current && document.activeElement !== nodeRef.current) {
            nodeRef.current.textContent = node.value;
        }
        if (isFocused) {
            nodeRef.current?.focus()
        } else {
            nodeRef.current?.blur()
        }
    }, [node, isFocused]);

    const parseCommand = (nodeType: NodeType) => {
        if (nodeRef.current) {
            changeNodeType(index, nodeType);
            nodeRef.current.textContent = "";
        }
    }

    const handleInput: FormEventHandler<HTMLDivElement> = ({currentTarget}) => {
        const { textContent } = currentTarget;
        changeNodeValue(index, textContent || "");
    }

    const handleClick = () => {
        updateFocusedIndex(index);
    }

    const onKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
        const target = event.target as HTMLDivElement;
        if (event.key === "Enter") {
            event.preventDefault();
        
            if (target.textContent?.[0] === "/") return;
        
            const selection = window.getSelection();
            const range = selection?.getRangeAt(0);
            const caretPos = range?.startOffset || 0;
        
            const fullText = target.textContent || "";
            const before = fullText.slice(0, caretPos);
            const after = fullText.slice(caretPos);
        
            // Update current node's value
            changeNodeValue(index, before);
        
            // Insert new node with remaining text
            const newNode = { type: node.type, value: after, id: nanoid() };
            addNode(newNode, index + 1);
        
            // Move focus to new node
            requestAnimationFrame(() => {
                const next = document.querySelector(`[data-node-index="${index + 1}"]`) as HTMLDivElement;
                if (next) {
                    const range = document.createRange();
                    range.setStart(next.firstChild || next, 0);
                    range.collapse(true);
        
                    const selection = window.getSelection();
                    if (selection) {
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
        
                    updateFocusedIndex(index + 1);
                }
            });
        }
        
        if (event.key === "Backspace") {
            const selection = window?.getSelection();
            if (target.textContent?.length === 0) {
                event.preventDefault();
                removeNodeByIndex(index);
                requestAnimationFrame(() => {
                    const prev = document.querySelector(`[data-node-index="${index - 1}"]`) as HTMLDivElement;
                    if (prev) {
                        placeCaretAtEnd(prev);
                        updateFocusedIndex(index - 1);
                    }
                });
            }    
             else if (selection?.anchorOffset === 0) {
                event.preventDefault();
                const prev = document.querySelector(`[data-node-index="${index - 1}"]`) as HTMLDivElement;
                const prevText = prev?.textContent || "";
            
                const currentText = target.textContent || "";
            
                // Merge text content
                if (prev) {
                    const boundaryIndex = prevText.length;

                    const mergedText = prevText + currentText;
            
                    prev.textContent = mergedText;
                    changeNodeValue(index - 1, mergedText);
                    removeNodeByIndex(index);
            
                    // Focus and place caret at end of merged text
                    requestAnimationFrame(() => {
                        // Set caret at the *end of the original first line*
                        const range = document.createRange();
                        range.setStart(prev.firstChild || prev, boundaryIndex);
                        range.collapse(true);
            
                        const selection = window.getSelection();
                        if (selection) {
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
            
                        updateFocusedIndex(index - 1);
                    });
                }}
        }

    };
    return (
        <>
        {
            showCommandPanel && (
                <CommandPanel selectItem={parseCommand} nodeText={node.value} />
            )
        }
        <div onClick={handleClick} 
        onInput={handleInput}
        onKeyDown={onKeyDown}
        ref={nodeRef} contentEditable
        data-node-index={index}
        suppressContentEditableWarning
        className={cx(styles.node, styles[node.type])}></div>
        </>
    )
}