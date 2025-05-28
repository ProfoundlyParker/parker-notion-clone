export type NodeType = "text" | "image" | "list" | "page" | "heading1" | "heading2" | "heading3"

export type NodeData = {
  id: string;
  type: NodeType;
  value: string;
  caption?: string;
  emoji?: string;
  width?: number;
  height?: number;
}

export type Page = {
  id: string;
  slug: string; // used to generate the URL of the page
  title: string;
  nodes: NodeData[];
  cover: string;
}