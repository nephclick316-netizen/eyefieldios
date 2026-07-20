# AI Studio App Guidelines

This document outlines the technical stack and coding conventions for the EyeField application, particularly focusing on the use of libraries and frameworks.

## Tech Stack Overview

*   **Framework**: React for building dynamic user interfaces.
*   **Language**: TypeScript for type safety and improved code quality.
*   **Styling**: Tailwind CSS for utility-first CSS, enabling rapid and consistent UI development.
*   **UI Components**: Shadcn/ui for pre-built, accessible, and customizable UI components.
*   **Icons**: Lucide-React for a comprehensive set of SVG icons.
*   **Routing**: React Router (implicitly used in `App.tsx` for page rendering based on state).
*   **Build Tool**: Vite for a fast development experience and optimized builds.
*   **AI Integration**: Google Gemini API via `@google/genai` for AI-powered features (Endocard AI).
*   **State Management**: React's `useState` and `useContext` for local and global state management.

## Library Usage Rules

To maintain consistency and efficiency, please adhere to the following rules when developing:

*   **React**: Use functional components and React Hooks for all new components. Avoid class components.
*   **TypeScript**: All new code must be written in TypeScript. Ensure proper typing for props, state, and functions.
*   **Tailwind CSS**: Prefer Tailwind CSS classes for all styling. Avoid writing custom CSS unless absolutely necessary for complex animations or very specific layouts not achievable with Tailwind.
*   **Shadcn/ui**: Utilize Shadcn/ui components whenever a suitable component exists for common UI patterns (e.g., buttons, forms, dialogs, cards). Do not modify Shadcn/ui source files directly; if a customization is needed, create a new component that wraps or extends the Shadcn/ui component.
*   **Lucide-React**: Use Lucide-React for all icons. Do not introduce other icon libraries.
*   **Routing**: Manage application routes within `src/App.tsx` using conditional rendering or a similar pattern. Avoid introducing external routing libraries unless explicitly approved.
*   **AI Services**: All AI interactions should go through the `services/geminiService.ts` file, leveraging the `@google/genai` library.
*   **File Structure**:
    *   Pages should reside in `src/pages/`.
    *   Reusable UI components should be in `src/components/`.
    *   Utility functions and services should be in `src/utils/` and `src/services/` respectively.
*   **Responsiveness**: All UI components and layouts must be designed with responsiveness in mind, utilizing Tailwind's responsive utility classes.
*   **Error Handling**: Implement basic error handling for user-facing actions (e.g., form submissions, API calls) using toasts or inline messages. Avoid overly complex try/catch blocks unless specifically required.