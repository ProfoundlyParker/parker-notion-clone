// components/NumberedListNode.tsx
import { useRef, useEffect, FormEventHandler, KeyboardEventHandler, useState } from "react";
import cx from "classnames";
import { NodeData, NodeType } from "../utils/types";
import styles from "./Node.module.css";
import { useAppState } from "../state/AppStateContext";
import { CommandPanel } from "./CommandPanel";

export const NumberedListNode = ({
    node,
    index,
    isFocused,
    updateFocusedIndex,
    registerRef
}: {
    node: NodeData;
    index: number;
    isFocused: boolean;
    updateFocusedIndex: (index: number) => void;
    registerRef?: (index: number, ref: HTMLDivElement) => void;
}) => {
    const nodeRef = useRef<HTMLDivElement>(null);
    const { changeNodeValue, removeNodeByIndex, addNode, changeNodeType } = useAppState();
    const showCommandPanel = isFocused && node?.value?.match(/^\//);
    const [currentNodeType, setCurrentNodeType] = useState<NodeType>(node.type);
    const [justChangedType, setJustChangedType] = useState(false);

    useEffect(() => {
            if (nodeRef.current && registerRef) {
                registerRef(index, nodeRef.current);
            }
        }, [nodeRef.current, index, registerRef]);

    useEffect(() => {
        if (!nodeRef.current) return;
        const editable = nodeRef.current;

        // Only update content if NOT focused and value is different
        if (
            document.activeElement !== editable &&
            editable.textContent !== node.value
        ) {
            editable.textContent = node.value || " ";
        }
        // Only focus if needed, but don't move caret!
        if (isFocused && document.activeElement !== editable) {
            editable.focus();
        }
        setCurrentNodeType(node.type);
    }, [node.value, isFocused, node.type]);


    const handleInput: FormEventHandler<HTMLDivElement> = ({ currentTarget }) => {
        changeNodeValue(index, currentTarget.textContent || "");
    };

    const handleClick = () => {
        updateFocusedIndex(index);
    };

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

       const parseCommand = (nodeType: NodeType) => {
            if (nodeRef.current) {
                changeNodeType(index, nodeType);
                nodeRef.current.textContent = "";
                setJustChangedType(true);
            }
        }

    const onKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
        const target = event.target as HTMLDivElement;

          if (event.key === "Backspace") {
            const selection = window.getSelection();
            const caretPos = selection?.getRangeAt(0)?.startOffset || 0;
            const text = (target.textContent || "")

            // Case 1: If node is empty
            if (text.length === 0) {
                event.preventDefault();
                removeNodeByIndex(index);

                requestAnimationFrame(() => {
                    const prevNode = document.querySelector(`[data-node-index="${index - 1}"] div[contenteditable]`) as HTMLDivElement;
                    if (prevNode) {
                        placeCaretAtEnd(prevNode);
                        updateFocusedIndex(index - 1);
                    }
                });
            }

            // Case 2: Not empty, but caret is at the start
            else if (caretPos === 0 && index > 0) {
                event.preventDefault();

                const prevNode = document.querySelector(
                    `[data-node-index="${index - 1}"] div[contenteditable]`
                ) as HTMLDivElement;
                const prevText = prevNode?.textContent || "";

                const mergedText = prevText + text;

                changeNodeValue(index - 1, mergedText);
                removeNodeByIndex(index);

                // 👇 Place caret at end of prevText, not end of mergedText
                const caretOffset = prevText.length;

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        const updatedPrev = document.querySelector(
                            `[data-node-index="${index - 1}"] div[contenteditable]`
                        ) as HTMLDivElement;

                        if (updatedPrev) {
                            const range = document.createRange();
                            const sel = window.getSelection();

                            // 👇 Use caretOffset to ensure correct placement
                            const textNode = updatedPrev.firstChild;
                            if (textNode) {
                                range.setStart(textNode, Math.min(caretOffset, textNode.textContent?.length || 0));
                                range.collapse(true);
                                sel?.removeAllRanges();
                                sel?.addRange(range);
                            }

                            updatedPrev.focus();
                            updateFocusedIndex(index - 1);
                        }
                    });
                });
            }

        }
        if (event.key === "Enter") {
            if (justChangedType) {
                setJustChangedType(false);
                return;
            }
            if (target.textContent?.[0] === "/") return;
                event.preventDefault();

                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) return;

                const range = selection.getRangeAt(0);
                const caretPos = range.startOffset;
                const fullText = target.textContent || "";

                const before = fullText.slice(0, caretPos);
                const after = fullText.slice(caretPos);

                // Update current node with text before cursor
            if (before !== node.value) {
                    changeNodeValue(index, before);
                }

                // Add new node with text after cursor (if any)
                addNode({ type: currentNodeType, value: after, id: crypto.randomUUID() }, index + 1);

                requestAnimationFrame(() => {
                    updateFocusedIndex(index + 1);
                });
        }
        if (event.key === "Delete") {
            const selection = window.getSelection();
            const caretPos = selection?.getRangeAt(0)?.startOffset ?? 0;
            const currentText = target.textContent ?? "";

            // If caret is at the end of this node
            if (caretPos === currentText.length) {
                event.preventDefault();

                const nextNodeEl = document.querySelector(
                    `[data-node-index="${index + 1}"] div[contenteditable]`
                ) as HTMLDivElement;

                if (nextNodeEl) {
                    const nextText = nextNodeEl.textContent ?? "";

                    // Merge text
                    const merged = currentText + nextText;
                    changeNodeValue(index, merged);
                    removeNodeByIndex(index + 1);

                    requestAnimationFrame(() => {
                        const thisNode = document.querySelector(
                            `[data-node-index="${index}"] div[contenteditable]`
                        ) as HTMLDivElement;

                        if (thisNode && thisNode.firstChild) {
                            const range = document.createRange();
                            const sel = window.getSelection();

                            range.setStart(thisNode.firstChild, currentText.length);
                            range.collapse(true);

                            sel?.removeAllRanges();
                            sel?.addRange(range);

                            thisNode.focus();
                        }
                    });
                }
            }
        }


    };

 return (
    <>
    {
        showCommandPanel && (
            <CommandPanel selectItem={parseCommand} nodeText={node.value} />
        )
    }
    <div
    className={cx(styles.node, styles.numberedList)}
    style={{ flex: 1 }}
    data-node-index={index}
    onClick={handleClick}
    >
        <div
            ref={(el) => {
                nodeRef.current = el;
                if (el && registerRef) {
                    registerRef(index, el);
                }
            }}
            contentEditable
            suppressContentEditableWarning
            className={styles.editable}
            style={{
                outline: "none",
                minHeight: 24,
                whiteSpace: "pre-wrap",
            }}
            onInput={handleInput}
            onKeyDown={onKeyDown}
            tabIndex={0}
        >
        </div>
    </div>
    </>
 )
};
