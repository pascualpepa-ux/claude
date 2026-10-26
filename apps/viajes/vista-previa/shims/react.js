// React se carga como script UMD desde cdnjs; este módulo reexporta el global.
const R = window.React;
export default R;
export const {
  Children, Fragment, Suspense, cloneElement, createContext, createElement, forwardRef, isValidElement, memo,
  useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useReducer, useRef, useState,
  useSyncExternalStore,
} = R;
