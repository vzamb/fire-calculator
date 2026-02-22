import { useEffect, useRef, useState } from 'react';
import fastDeepEqual from 'fast-deep-equal';
import type { FireInputs } from '@/types';
import type { MonteCarloResult } from './monteCarlo';
import type { MCWorkerRequest, MCWorkerResponse } from './monteCarlo.worker';

/**
 * Custom hook that acts like useEffect but does a deep comparison of dependencies.
 */
function useDeepCompareEffect(callback: React.EffectCallback, dependencies: any[]) {
  const currentDependenciesRef = useRef<any[]>([]);

  if (!fastDeepEqual(currentDependenciesRef.current, dependencies)) {
    currentDependenciesRef.current = dependencies;
  }

  useEffect(callback, [currentDependenciesRef.current]);
}

/**
 * Runs Monte Carlo simulations in a Web Worker so the main thread is never
 * blocked. Debounces rapid input changes (300 ms) to avoid spamming the
 * worker. Stale responses are discarded via a monotonic request ID.
 */
export function useMonteCarloWorker(
  inputs: FireInputs,
  numSimulations: number,
  targetFireAge: number | undefined,
): { mc: MonteCarloResult | null; isComputing: boolean } {
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mc, setMc] = useState<MonteCarloResult | null>(null);
  const [isComputing, setIsComputing] = useState(true);

  // Create worker once on mount, tear it down on unmount.
  useEffect(() => {
    const worker = new Worker(
      new URL('./monteCarlo.worker.ts', import.meta.url),
      { type: 'module' },
    );

    worker.onmessage = (e: MessageEvent<MCWorkerResponse>) => {
      const { id, result } = e.data;
      // Discard any response that arrived after a newer request was fired.
      if (id === requestIdRef.current) {
        setMc(result);
        setIsComputing(false);
      }
    };

    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Debounce + dispatch: whenever meaningful inputs change, wait 300 ms then
  // send to the worker. The UI is fully responsive throughout.
  useDeepCompareEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    setIsComputing(true);

    debounceRef.current = setTimeout(() => {
      const id = ++requestIdRef.current;
      workerRef.current?.postMessage({
        id,
        inputs,
        numSimulations,
        targetFireAge,
      } satisfies MCWorkerRequest);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputs, numSimulations, targetFireAge]);

  return { mc, isComputing };
}
