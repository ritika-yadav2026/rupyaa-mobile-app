type NavigationListener = (route: string) => void;

class NavigationService {
  private listeners: Set<NavigationListener> = new Set();
  private routerInstance: { replace: (route: string) => void } | null = null;
  private currentRoute: string | null = null;

  setRouter(router: { replace: (route: string) => void }): void {
    this.routerInstance = router;
  }

  /**
   * Update current route from a React component that can access usePathname().
   */
  setCurrentRoute(route: string): void {
    this.currentRoute = route;
  }

  getCurrentRoute(): string | null {
    return this.currentRoute;
  }

  addListener(listener: NavigationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  navigate(route: string): void {
    if (this.currentRoute === route) {
      return;
    }

    this.currentRoute = route;

    if (this.routerInstance) {
      this.routerInstance.replace(route);
      return;
    }

    this.listeners.forEach((listener) => {
      try {
        listener(route);
      } catch (error) {
        console.error('[NavigationService] Error in navigation listener:', error);
      }
    });
  }
}

export const navigationService = new NavigationService();