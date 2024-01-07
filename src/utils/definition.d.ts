declare global {
    interface Window {
        globalLastActiveCheckOnScrollSwitch: number;
    }
}
  
// deprecated since 2024.01.07 but this is how you add to existing interface in TS
export {};