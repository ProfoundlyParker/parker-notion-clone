import { renderHook, act } from '@testing-library/react';
import { useSyncedState } from './useSyncedState';

describe('useSyncedState', () => {
  it('initializes with the given state', () => {
    const { result } = renderHook(() =>
      useSyncedState({ count: 0 }, () => {})
    );

    const [state] = result.current;
    expect(state).toEqual({ count: 0 });
  });

  it('does not call syncCallBack on initial render', () => {
    const syncCallBack = vi.fn();

    renderHook(() =>
      useSyncedState({ count: 0 }, syncCallBack)
    );

    expect(syncCallBack).not.toHaveBeenCalled();
  });

  it('calls syncCallBack when state changes after mount', () => {
    const syncCallBack = vi.fn();

    const { result } = renderHook(() =>
      useSyncedState({ count: 0 }, syncCallBack)
    );

    act(() => {
      const [, setState] = result.current;
      setState((draft) => {
        draft.count += 1;
      });
    });

    expect(syncCallBack).toHaveBeenCalledWith({ count: 1 });
  });

  it('updates state using Immer-style updates', () => {
    const { result } = renderHook(() =>
      useSyncedState({ name: 'Alice' }, () => {})
    );

    act(() => {
      const [, setState] = result.current;
      setState((draft) => {
        draft.name = 'Bob';
      });
    });

    const [state] = result.current;
    expect(state.name).toBe('Bob');
  });
});