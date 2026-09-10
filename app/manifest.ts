import type { MetadataRoute } from "next";

export default function manifest():MetadataRoute.Manifest{return{
 name:"NOURA — Personal Health OS",
 short_name:"NOURA",
 description:"Nutrición, hábitos, recuperación y rendimiento.",
 start_url:"/",
 display:"standalone",
 background_color:"#080a0c",
 theme_color:"#080a0c",
 orientation:"portrait",
 categories:["health","fitness","lifestyle"],
 icons:[
  {src:"/noura-icon.svg",sizes:"any",type:"image/svg+xml",purpose:"any"},
  {src:"/noura-icon-maskable.svg",sizes:"any",type:"image/svg+xml",purpose:"maskable"}
 ]
};}
