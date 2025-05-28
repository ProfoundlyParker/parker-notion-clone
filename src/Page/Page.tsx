import { useFocusedNodeIndex } from "./useFocusNodeIndex";
import { Cover } from "./Cover";
import { Spacer } from "./Spacer";
import { Title } from "./Title";
import { nanoid } from "nanoid";
import { useAppState } from "../state/AppStateContext";
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { NodeContainer } from "../Node/NodeContainer";
import { useNavigate, useParams } from "react-router-dom";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { supabase } from "../supabaseClient";
import styles from './Page.module.css';
import { useEffect, useRef, useState } from "react";
import { NodeData } from "../utils/types";
import { PageIdContext } from "./PageIdContext";

type PageNodeProps = {
    node?: NodeData;
}

export const Page = ({ node }: PageNodeProps) => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [numericId, setNumericId] = useState<number | null>(null);
    const {title, nodes, addNode, cover, setCoverImage, reorderNodes, setTitle} = useAppState();
    const [focusedNodeIndex, setFocusedNodeIndex] = useFocusedNodeIndex({ nodes });
    const [emoji, setEmoji] = useState("📃");
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    const handleBackClick = () => {
        navigate(-1);
    }; 

    const fetchPageId = async () => {
        const slug = node?.value || id || "start";

        try {
            const { data, error } = await supabase
                .from('pages')
                .select('id')
                .eq('slug', slug)
                .single();

            if (error) {
                console.error('Error fetching page data:', error);
                return;
            }

            // If data is returned, set the numeric ID
            if (data?.id) {
                setNumericId(data.id);  // Assuming 'id' is an integer in your table
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        }
        
        console.log(slug, id);
    };

    useEffect(() => {
        fetchPageId();
        const fetchPageData = async () => {
            const slug = node?.value || id || "start";
            if (!slug) {
                return;
            }
    
            try {
                const { data, error } = await supabase
                    .from("pages")
                    .select("emoji, title")
                    .eq("slug", slug)
                    .single();
    
                if (error && error.code === "PGRST116") {
                    return;
                }
    
                if (error) {
                    return;
                }
    
                if (data) {
                    setTitle(data.title);
                    setEmoji(data.emoji || "📃");
                }
            } catch (err) {
                console.error("Unexpected error:", err);
            }
        };
    
        fetchPageData();
    }, [id, node?.value, setTitle]);
    

    const handleEmojiClick = async (emojiObject: EmojiClickData) => {
        const selectedEmoji = emojiObject.emoji;
        setEmoji(selectedEmoji);
        setShowPicker(false);
    
        const slug = node?.value || id;
        if (selectedEmoji && slug) {
            const { error } = await supabase
                .from("pages")
                .update({ emoji: selectedEmoji })
                .eq("slug", slug);
    
            if (error) {
                console.error("Error updating emoji:", error);
                return;
            }
 
            const { data } = await supabase
                .from("pages")
                .select("emoji, title")
                .eq("slug", slug)
                .single();
    
            if (data) {
                setTitle(data.title);
                setEmoji(data.emoji || "📃");
            }
        }
    };
    

    const handleEmojiIconClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowPicker((prev) => !prev);
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

    const handleDragEvent = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over?.id && active.id !== over?.id) {
            reorderNodes(active.id as string, over.id as string)
        }
    }

    const handleTitleChange = async (newTitle: string) => {
        setTitle(newTitle);
        const slug = node?.value || id;
        if (slug) {
            const { error } = await supabase
                .from("pages")
                .update({ title: newTitle })
                .eq("slug", slug);
    
            if (error) {
                return;
            }
        }
    };

    return (
        <>
        {id && (
                <button onClick={handleBackClick} className={styles.backButton}>Previous Page</button>
            )}
        <Cover filePath={cover} changePageCover={setCoverImage} pageId={numericId} />
        <PageIdContext.Provider value={numericId?.toString()}>
        {id && (
            <div className={styles.pageHeader}>
                    <span onClick={handleEmojiIconClick} className={styles.emoji}>
                        {emoji}
                    </span>
                    {showPicker && (
                        <div
                            className={styles.emojiPicker}
                            ref={pickerRef}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <EmojiPicker onEmojiClick={handleEmojiClick} />
                        </div>
                    )}
                </div>
            )}
            <div>
               <Title addNode={addNode} title={title} changePageTitle={handleTitleChange} />
                <DndContext onDragEnd={handleDragEvent}>
                    <SortableContext items={nodes} strategy={verticalListSortingStrategy}>
                        {nodes.map((node, index) => (
                            <NodeContainer
                                key={node.id}
                                node={node}
                                isFocused={focusedNodeIndex === index}
                                updateFocusedIndex={setFocusedNodeIndex}
                                index={index}
                            />
                        ))}
                    </SortableContext>
                    <DragOverlay />
                </DndContext>
                <Spacer
                    showHint={!nodes.length}
                    handleClick={() => {
                        addNode({ type: "text", value: "", id: nanoid() }, nodes.length);
                    }}
                />
        </div>
        </PageIdContext.Provider>
        </>
    )
}