import { useEffect, useRef } from "react"
import { ImmerHook, useImmer } from "use-immer"

export const useSyncedState = <TState>(
    initialState: renderToStaticNodeStream,
    syncCallBack: (state: TState) => void
): ImmerHook<TState> => {
    const [state, setState] = useImmer(initialState);
    const didMountRef = useRef(false);

    useEffect(() => {
        if (didMountRef.current) {
            syncCallBack(state)
        }
        didMountRef.current = true;
    }, [state, setState])

    return [state, setState]
}