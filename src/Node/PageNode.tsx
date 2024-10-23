import { useNavigate } from "react-router-dom";
import { NodeData } from "../utils/types"
import { useEffect, useRef, useState } from "react";
import { useAppState } from "../state/AppStateContext";
import { supabase } from "../supabaseClient";
import cx from "classnames";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import styles from "./Node.module.css";

type PageNodeProps = {
    node: NodeData;
    isFocused: boolean;
    index: number;
}

export const PageNode = ({ node, isFocused, index }: PageNodeProps) => {
    const navigate = useNavigate();
    const [ pageTitle , setPageTitle ] = useState("");
    const { removeNodeByIndex } = useAppState();
    const [emoji, setEmoji] = useState("📃");
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            event.preventDefault();
            if (event.key === "Backspace") {
                removeNodeByIndex(index);
            }
            if (event.key === "Enter") {
                navigate(`/${node.value}`);
            }
        };
        if (isFocused) {
            window.addEventListener("keydown", handleKeyDown);
        } else {
            window.removeEventListener("keydown", handleKeyDown);
        }
        
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        }
    }, [isFocused, removeNodeByIndex, index, navigate, node])

    useEffect(() => {
        const fetchPageData = async () => {
            const { data } = await supabase
                .from("pages")
                .select("title, emoji")
                .eq("slug", node.value)
                .single();
            if (data) {
                setPageTitle(data?.title);
                setEmoji(data?.emoji || "📃");
            }
        }
       fetchPageData();
    }, [node.type, node.value]);

    const handleEmojiClick = (emojiObject: EmojiClickData) => {
        const selectedEmoji = emojiObject.emoji;
        setEmoji(selectedEmoji);
        if (selectedEmoji) {
            setEmoji(selectedEmoji);
            setShowPicker(false);
            if (node.value) {
                supabase
                    .from("pages")
                    .update({ emoji: selectedEmoji })
                    .eq("slug", node.value)
                    .then(() => {
                        console.log("Emoji updated successfully");
                    })
            }}
    };

    const handlePageClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/${node.value}`);
    };

    const handleEmojiIconClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowPicker((prev) => !prev);
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setPageTitle(newTitle);
        if (node.value) {
            supabase
                .from("pages")
                .update({ title: newTitle })
                .eq("slug", node.value)
                .then(() => {
                    console.log("Title updated successfully");
                });
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowPicker(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className={cx(styles.node, styles.page, {
            [styles.focused]: isFocused
        })}>
            <div className={styles.pageContent} onClick={handlePageClick}>
                <span onClick={handleEmojiIconClick} className={styles.emoji}>
                    {emoji}
                </span>
                {showPicker && (
                    <div className={styles.emojiPicker} ref={pickerRef} onClick={(e) => e.stopPropagation()}>
                        <EmojiPicker onEmojiClick={handleEmojiClick} />
                    </div>
                )}
                <span className={styles.pageTitle} onChange={handleTitleChange}>{pageTitle}</span>
            </div>
        </div>
    )
}