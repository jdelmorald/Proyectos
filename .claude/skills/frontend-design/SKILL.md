---
name: frontend-design
description: Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults. Calibrated for Sistema Contable Delder (multi-company Venezuelan accounting software) — use it whenever visual/UI design work is requested on this project.
license: Complete terms in LICENSE.txt
---

# Frontend Design

Approach this as the design lead at a small studio known for giving every client a visual identity that could not be mistaken for anyone else's. This client has already rejected proposals that felt templated, and is paying for a distinctive point of view: make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief, and take one real aesthetic risk you can justify.

## Ground it in the subject

If the brief does not pin down what the product or subject is, pin it yourself before designing: name one concrete subject, its audience, and the page's single job, and state your choice. If there's any information in your memory about the human's preferences, context about what they're building, or designs you've made before – use that as a hint. The subject's own world, its materials, instruments, artifacts, and vernacular, is where distinctive choices come from. Build with the brief's real content and subject matter throughout.

## Design principles

For web designs, the hero is a thesis. Open with the most characteristic thing in the subject's world, in whatever form makes sense for it: a headline, an image, an animation, a live demo, an interactive moment. Be deliberate with your choice: a big number with a small label, supporting stats, and a gradient accent is the template answer, only use if that's truly the best option.

Typography carries the personality of the page. Pair the display and body faces deliberately, not the same families you would reach for on any other project, and set a clear type scale with intentional weights, widths, and spacing. Make the type treatment itself a memorable part of the design, not a neutral delivery vehicle for the content.

Structure is information. Structural devices, numbering, eyebrows, dividers, labels, should encode something true about the content, not decorate it. Many generic designs use numbered markers (01 / 02 / 03), but that's only appropriate if the content actually is a sequence - like a real process or a typed timeline where order carries information the reader needs. Question if choices like numbered markers actually make sense before incorporating them.

Leverage motion deliberately. Think about where and if animation can serve the subject: a page-load sequence, a scroll-triggered reveal, hover micro-interactions, ambient atmosphere. An orchestrated moment usually lands harder than scattered effects; choose what the direction calls for. However, sometimes less is more, and extra animation contributes to the feeling that the design is AI-generated.

Match complexity to the vision. Maximalist directions need elaborate execution; minimal directions need precision in spacing, type, and detail. Elegance is executing the chosen vision well.

Consider written content carefully. Often a design brief may not contain real content, and it's up to you to come up with copy. Copy can make a design feel as templated as the design itself. See the below section on writing for more guidance.

## Process: brainstorm, explore, plan, critique, build, critique again

For calibration: AI-generated design right now clusters around three looks: (1) a warm cream background (near #F4F1EA) with a high-contrast serif display and a terracotta accent; (2) a near-black background with a single bright acid-green or vermilion accent; (3) a broadsheet-style layout with hairline rules, zero border-radius, and dense newspaper-like columns. All three are legitimate for some briefs, but they are defaults rather than choices, and they appear regardless of subject. Where the brief pins down a visual direction, follow it exactly — the brief's own words always win, including when it asks for one of these looks. Where it leaves an axis free, don't spend that freedom on one of these defaults. Just like a human designer who's hired, there's often a careful balance between doing what you're good at and taking each project as a chance to experiment and learn.

Work in two passes. First, brainstorm a short design plan based on the human's design brief: create a compact token system with color, type, layout, and signature. Color: describe the palette as 4–6 named hex values. Type: the typefaces for 2+ roles (a characterful display face that's used with restraint, a complementary body face, and a utility face for captions or data if needed). Layout: a layout concept, using one-sentence prose descriptions and ASCII wireframes to ideate and compare. Signature: the single unique element this page will be remembered by that embodies the brief in an appropriate way.

Then review that plan against the brief before building: if any part of it reads like the generic default you would produce for any similar page (work through a similar prompt to see if you arrive somewhere similar) rather than a choice made for this specific brief — revise that part, say what you changed and why. Only after you've confirmed the relative uniqueness of your design plan should you start to write the code, following the revised plan exactly and deriving every color and type decision from it.

When writing the code, be careful of structuring your CSS selector specificities. It's easy to generate CSS classes that cancel each other out (especially with a type-based selector like .section and a element-based selector like .cta). This can happen often with paddings/margins between sections.

Try to do a lot of this planning and iteration in your thinking, and only show ideas to the user when you have higher confidence it'll delight them.

## Restraint and self-critique

Spend your boldness in one place. Let the signature element be the one memorable thing, keep everything around it quiet and disciplined, and cut any decoration that does not serve the brief. Not taking a risk can be a risk itself! Build to a quality floor without announcing it: responsive down to mobile, visible keyboard focus, reduced motion respected. Critique your own work as you build, taking screenshots if your environment supports it – a picture is worth 1000 tokens. Consider Chanel's advice: before leaving the house, take a look in the mirror and remove one accessory. Human creators have memory and always try to do something new, so if you have a space to quickly jot down notes about what you've tried, it can help you in future passes.

## More on writing in design

Words appear in a design for one reason: to make it easier to understand, and therefore easier to use. They are design material, not decoration. Bring the same intentionality to copy that you would bring to spacing and color. Before writing anything, ask what the design needs to say, and how it can best be said to help the person navigate the experience.

Write from the end user's side of the screen. Name things by what people control and recognize, never by how the system is built. A person manages notifications, not webhook config. Describe what something does in plain terms rather than selling it. Being specific is always better than being clever.

Use active voice as default. A control should say exactly what happens when it's used: "Save changes," not "Submit." An action keeps the same name through the whole flow, so the button that says "Publish" produces a toast that says "Published." The vocabulary of an interface is the signposting for someone navigating the product. Cohesion and consistency are how people learn their way around.

Treat failure and emptiness as moments for direction, not mood. Explain what went wrong and how to fix it, in the interface's voice rather than a person's. Errors don't apologize, and they are never vague about what happened. An empty screen is an invitation to act.

Keep the register conversational and tuned: plain verbs, sentence case, no filler, with tone matched to the brand and the audience. Let each element do exactly one job. A label labels, an example demonstrates, and nothing quietly does double duty.

## Calibration for Sistema Contable Delder

This project is not a marketing site or a consumer app — it's the books of record for four real companies (Sumivensa, Salud San Marcos, Indelderca, Uomo Store), used daily by non-technical accountants and by Jesús, the owner, to make financial decisions. Design choices here carry a different weight than on a landing page. A few rules specific to this subject:

- **Trust and legibility outrank flair.** Every number the user sees here is a real balance, debit, or haber that has to reconcile to the peso. Never let a design choice (low-contrast gray, decorative font, cramped spacing) make a figure harder to read at a glance. Tabular/monospaced figures for money columns, generous row height, right-aligned amounts, and a restrained palette for state (red for anulado/negativo, green for cuadra/positivo) are functional requirements, not style preferences.
- **The brand system already exists — extend it, don't replace it.** Grupo Delder's identity is a deep navy (`brand-900 #101a2b` family) with a gold accent (`gold-500 #d4af5a`) as the "father brand," and each subsidiary carries its own accent used already in `tailwind.config.js` (Sumivensa red, Salud San Marcos blue, Indelderca navy, Uomo Store terracotta) and in the exported PDF/Excel headers. Any redesign should feel like the next chapter of this identity, not a rebrand — reuse these tokens as the base palette instead of inventing a new one from scratch, unless the user explicitly asks to rebrand.
- **Screen and export are one family.** The PDF/Excel exports (`client/src/utils/exportar.ts`) already established a visual language: a three-zone header (logo+company | title+currency | metadata), a divider rule in the company's accent color, subtotal/total row highlighting. When touching on-screen report pages, keep that same logic legible so a user recognizes the printed version as "the same document," not a different product.
- **Spanish, sentence case, and the existing voice.** Copy is in Venezuelan Spanish, direct and plain (see existing labels like "Registrar Asiento", "No cuentas con permisos para acceder a este módulo"). Match that register — don't switch to English design jargon or overly casual tone in UI copy.
- **Motion is a garnish here, not a feature.** This audience opens the app to close the books, not to be delighted by an animation. Subtle transitions (hover states, a smooth page transition, a considered loading state) are welcome; scroll-triggered reveals or ambient motion are very likely the wrong call unless there's a specific moment (e.g., a dashboard chart animating in once) that earns it.
- **Test with real data shapes.** This system already has a rigorous verification habit (Playwright screenshots, hand-checked totals). Extend that to design work: screenshot the redesigned page with real Venezuelan bolívar amounts (large integer parts, `.` thousands / `,` decimals), long company names/razón social, and both empty and populated states — not lorem ipsum or round demo numbers that hide overflow bugs.

When starting a new visual pass on this project, do the brainstorm → plan → critique step from the process above explicitly, but frame the "brief" as: which screen/flow, for which of the four companies' contexts (or the neutral admin context), doing what job — then propose the token/type/layout/signature plan to Jesús before writing code, since he is non-technical and needs to approve direction, not just review a finished diff.
