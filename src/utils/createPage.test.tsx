// __tests__/createPage.test.ts
import { createPage } from "../utils/createPage";
import { supabase } from "../supabaseClient";

vi.mock("../supabaseClient", async () => {
    const getUser = vi.fn();
    const insert = vi.fn();
    const select = vi.fn();
    const single = vi.fn();

    const from = vi.fn(() => ({
        insert,
        select,
        single,
    }));

    return {
        supabase: {
            auth: {
                getUser,
            },
            from,
        },
    };
});

describe("createPage", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("throws an error if user is not logged in", async () => {
        (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });

        await expect(createPage()).rejects.toThrow("You must be logged in to create a page.");
    });

    it("creates and returns a new page", async () => {
        const fakeUser = { id: "user_123" };
        const fakeInsertedPage = {
            id: "page_123",
            slug: "slug_xyz",
            title: "Untitled Page",
            nodes: [],
            created_by: "user_123",
            emoji: "",
        };

        (supabase.auth.getUser as any).mockResolvedValue({ data: { user: fakeUser } });

        const insertMock = vi.fn(() => ({
            select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                    data: fakeInsertedPage,
                    error: null,
                }),
            })),
        }));

        (supabase.from as any).mockImplementation(() => ({
            insert: insertMock,
        }));

        const result = await createPage();
        expect(result).toEqual(fakeInsertedPage);
    });

    it("throws an error if Supabase insert fails", async () => {
        const fakeUser = { id: "user_123" };
        const fakeError = new Error("Insert failed");

        (supabase.auth.getUser as any).mockResolvedValue({ data: { user: fakeUser } });

        const insertMock = vi.fn(() => ({
            select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                    data: null,
                    error: fakeError,
                }),
            })),
        }));

        (supabase.from as any).mockImplementation(() => ({
            insert: insertMock,
        }));

        await expect(createPage()).rejects.toThrow("Insert failed");
    });
});