// import { useEffect, useState } from "react";
// import { useMatch } from "react-router-dom";
// import { supabase } from "../supabaseClient";
// import startPageScaffold from "./startPageScaffold.json";
// import styles from "../utils.module.css";
// import { Loader } from "../components/Loader";
// import { Page } from "../utils/types";

// type InjectedProps = {
//   initialState: Page;
// };

// type PropsWithoutInjected<TBaseProps> = Omit<TBaseProps, keyof InjectedProps>;

// export const withInitialState = <TProps extends InjectedProps>(
//   WrappedComponent: React.ComponentType<TProps>
// ) => (props: PropsWithoutInjected<TProps>) => {
//   const match = useMatch("/:slug");
//   const pageSlug = match ? match.params.slug : "start";

//   const [initialState, setInitialState] = useState<Page | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<Error | undefined>();

//   useEffect(() => {
//     const fetchInitialState = async () => {
//       setIsLoading(true);
//       try {
//         const { data: userData } = await supabase.auth.getUser();
//         const user = userData.user;
//         if (!user) {
//           throw new Error("User is not logged in");
//         }
//         const { data } = await supabase
//           .from("pages")
//           .select("title, id, cover, nodes, slug")
//           .match({ slug: pageSlug, created_by: user.id })
//           .single();
//         if (!data && pageSlug === "start") {
//           const result = await supabase
//             .from("pages")
//             .insert({
//               ...startPageScaffold,
//               slug: "start",
//               created_by: user.id,
//             })
//             .single();
//           setInitialState(result?.data);
//         } else {
//           setInitialState(data);
//         }
//       } catch (e) {
//         if (e instanceof Error) {
//           setError(e);
//         }
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchInitialState();
//   }, [pageSlug]);

//   if (isLoading) {
//     return (
//       <div className={styles.centeredFlex}>
//         <Loader />
//       </div>
//     );
//   }

//   if (error) {
//     return <div>{error.message}</div>; // Render error message instead of Error component
//   }

//   if (!initialState) {
//     return <div className={styles.centeredFlex}>Page not found</div>;
//   }

//   return <WrappedComponent {...props as TProps} initialState={initialState} />;
// };

import { Page } from "../utils/types";
import { useMatch } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import startPageScaffold from "./startPageScaffold.json";
import styles from "../utils.module.css";
import { Loader } from "../components/Loader";

type InjectedProps = {
  initialState: Page;
};

type PropsWithoutInjected<TBaseProps> = Omit<TBaseProps, keyof InjectedProps>;

export function withInitialState<TProps>(
  WrappedComponent: React.ComponentType<
    PropsWithoutInjected<TProps> & InjectedProps
  >
) {
  return (props: PropsWithoutInjected<TProps>) => {
    const match = useMatch("/:slug");
    const pageSlug = match ? match.params.slug : "start";

    const [initialState, setInitialState] = useState<Page | null>();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | undefined>();
    const inProgress = useRef(false)

    useEffect(() => {
      if (inProgress.current) {
        return
      }
      setIsLoading(true);
      inProgress.current = true
      const fetchInitialState = async () => {
        try {
          const { data: userData } = await supabase.auth.getUser();
          const user = userData.user;
          if (!user) {
            throw new Error("User is not logged in");
          }
          const { data } = await supabase
            .from("pages")
            .select("title, id, cover, nodes, slug")
            .match({ slug: pageSlug, created_by: user.id })

          if (data?.[0]) {
            setInitialState(data?.[0]);
            inProgress.current = false;
            setIsLoading(false);
            return
          }

          if (pageSlug === "start") {
            await supabase
              .from("pages")
              .insert({
                ...startPageScaffold,
                slug: "start",
                created_by: user.id,
              })

            const { data } = await supabase
              .from("pages")
              .select("title, id, cover, nodes, slug")
              .match({ slug: "start", created_by: user.id })

            setInitialState(data?.[0]);
          } else {
            setInitialState(data?.[0]);
          }
        } catch (e) {
          if (e instanceof Error) {
            setError(e);
          }
        }
        inProgress.current = false;
        setIsLoading(false);
      };
      fetchInitialState();
    }, [pageSlug]);

    if (isLoading) {
      return (
        <div className={styles.centeredFlex}>
          <Loader />
        </div>
      );
    }

    if (error) {
      return <div>{error.message}</div>;
    }

    if (!initialState) {
      return <div className={styles.centeredFlex}>Page not found</div>;
    }

    return <WrappedComponent {...props} initialState={initialState} />;
  };
}