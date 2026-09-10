"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type TgBackButton={show?:()=>void;hide?:()=>void;onClick?:(cb:()=>void)=>void;offClick?:(cb:()=>void)=>void};
type TgWebApp={
  initData?:string;
  ready?:()=>void;
  expand?:()=>void;
  setHeaderColor?:(color:string)=>void;
  setBackgroundColor?:(color:string)=>void;
  setBottomBarColor?:(color:string)=>void;
  disableVerticalSwipes?:()=>void;
  enableVerticalSwipes?:()=>void;
  onEvent?:(name:string,cb:()=>void)=>void;
  offEvent?:(name:string,cb:()=>void)=>void;
  BackButton?:TgBackButton;
  safeAreaInset?:{top?:number;right?:number;bottom?:number;left?:number};
  contentSafeAreaInset?:{top?:number;right?:number;bottom?:number;left?:number};
};
type TgWindow=Window&{Telegram?:{WebApp?:TgWebApp}};

function applySafeArea(webApp:TgWebApp){
  const root=document.documentElement;
  const safe=webApp.contentSafeAreaInset||webApp.safeAreaInset||{};
  root.style.setProperty("--noura-safe-top",`${Math.max(0,safe.top||0)}px`);
  root.style.setProperty("--noura-safe-right",`${Math.max(0,safe.right||0)}px`);
  root.style.setProperty("--noura-safe-bottom",`${Math.max(0,safe.bottom||0)}px`);
  root.style.setProperty("--noura-safe-left",`${Math.max(0,safe.left||0)}px`);
}

export default function NouraClient(){
  const pathname=usePathname();

  useEffect(()=>{
    const tg=(window as TgWindow).Telegram?.WebApp;
    if(!tg?.initData)return;

    try{tg.ready?.();}catch{}
    try{tg.expand?.();}catch{}
    try{tg.setHeaderColor?.("#080a0c");}catch{}
    try{tg.setBackgroundColor?.("#080a0c");}catch{}
    try{tg.setBottomBarColor?.("#080a0c");}catch{}
    try{tg.disableVerticalSwipes?.();}catch{}
    try{applySafeArea(tg);}catch{}

    const refreshSafeArea=()=>{try{applySafeArea(tg);}catch{}};
    tg.onEvent?.("safeAreaChanged",refreshSafeArea);
    tg.onEvent?.("contentSafeAreaChanged",refreshSafeArea);
    tg.onEvent?.("viewportChanged",refreshSafeArea);

    return()=>{
      tg.offEvent?.("safeAreaChanged",refreshSafeArea);
      tg.offEvent?.("contentSafeAreaChanged",refreshSafeArea);
      tg.offEvent?.("viewportChanged",refreshSafeArea);
      try{tg.enableVerticalSwipes?.();}catch{}
    };
  },[]);

  useEffect(()=>{
    const tg=(window as TgWindow).Telegram?.WebApp;
    const back=tg?.BackButton;
    if(!tg?.initData||!back)return;

    const goBack=()=>{
      if(window.history.length>1)window.history.back();
      else window.location.href="/";
    };

    if(pathname&&pathname!=="/"){
      try{back.show?.();back.onClick?.(goBack);}catch{}
      return()=>{try{back.offClick?.(goBack);back.hide?.();}catch{}};
    }

    try{back.hide?.();}catch{}
  },[pathname]);

  useEffect(()=>{
    const inTelegram=Boolean((window as TgWindow).Telegram?.WebApp?.initData);
    if(inTelegram)return;
    if("serviceWorker" in navigator)navigator.serviceWorker.register("/sw.js").catch(()=>{});
  },[]);

  return null;
}
