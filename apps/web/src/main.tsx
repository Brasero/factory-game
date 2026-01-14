
import * as React from "react";
import { createRoot } from 'react-dom/client'
import './index.scss'
import App from './App.tsx'
import {Provider} from "react-redux"
import store from "./store/store.ts";
import type {ReactNode} from "react";

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
        <App />
    </Provider>
  </React.StrictMode> as ReactNode
  ,
)