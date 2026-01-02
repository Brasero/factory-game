import {useDispatch, useSelector} from "react-redux";
import type {TypedUseSelectorHook} from "react-redux";
import type {RootState, AppDispatch} from "./store.types.ts";


//Hooks typés pour l'utilisation de Redux dans l'application

//Utilisation typée de useDispatch
export const useAppDispatch = () => useDispatch<AppDispatch>();

//Utilisation typée de useSelector
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;