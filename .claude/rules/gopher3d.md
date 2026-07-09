---
paths:
  - js/gopher3d.js
  - js/gopher3d.data.js
---

## 3D hero mascot

The home hero shows a dancing 3D gopher (`.hero-gopher` canvas) at every viewport width: a middle hero column on desktop, beside the progress ring below 1080px, smaller below 560px.
It is a rigged GLB (Meshy "All_Night_Dance" clip, 2048px JPEG texture) rendered by a hand-rolled WebGL viewer in `js/gopher3d.js` - deliberately NOT three.js, to preserve the zero-dependency constraint.
The GLB ships base64-embedded in `js/gopher3d.data.js` because `fetch`/XHR of a local file fails over `file://`.
The canvas is decorative (`aria-hidden`), draws no text, and therefore needs no i18n entries.
If WebGL is unavailable the canvas hides itself and the hero layout keeps flowing without it.
Camera framing samples the animation to compute true animated bounds and refits per frame for the current canvas aspect - if you swap the GLB, no manual reframing should be needed, but re-verify with screenshots at several widths since a clipped pose was a real bug here.
`applyClip` damps each joint toward its rest pose by name (`dampFor`): dance clips are authored for slim humanoids, and at full strength they buried the gopher's stubby arms inside the torso; tune `dampFor`, not the clip data, if the motion needs adjusting.
Texture dimensions must stay power-of-two: WebGL1 silently samples black from an NPOT texture with a mipmap filter (a real bug here when a 1536px texture was tried; the viewer now guards NPOT, but POT is still the quality path).
