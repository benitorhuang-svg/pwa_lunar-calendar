/**
 * Parallax Manager
 * 負責陀螺儀視差效果，增強沉浸感 (Handles gyroscope parallax for immersion)
 */
export class ParallaxManager {
    private container: HTMLElement | null = null;
    private maxTilt = 15; // 度 (degrees)
    private sensitivity = 0.5;

    constructor() {
        this.container = document.getElementById("heroBgContainer");
    }

    public init(): void {
        if (!this.container) return;

        // Ensure container has space to move without showing edges
        this.container.style.transition = "transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)";
        this.container.style.transform = "scale(1.08)";

        if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
            // iOS 13+ requires permission
            this.container.addEventListener("click", () => this.requestPermission(), {
                once: true,
            });
        } else {
            window.addEventListener("deviceorientation", (e) => this.handleMotion(e));
        }
    }

    private handleMotion(e: DeviceOrientationEvent): void {
        if (!e.beta || !e.gamma) return;

        // Beta: front-to-back tilt [-180, 180]
        // Gamma: left-to-right tilt [-90, 90]
        const y = Math.max(-this.maxTilt, Math.min(this.maxTilt, e.beta - 45)); // Offset for natural holding angle
        const x = Math.max(-this.maxTilt, Math.min(this.maxTilt, e.gamma));

        const moveX = x * this.sensitivity;
        const moveY = y * this.sensitivity;

        if (this.container) {
            this.container.style.transform = `scale(1.08) translate(${moveX}px, ${moveY}px)`;
        }
    }

    private requestPermission(): void {
        (DeviceOrientationEvent as any)
            .requestPermission()
            .then((state: string) => {
                if (state === "granted") {
                    window.addEventListener("deviceorientation", (e) => this.handleMotion(e));
                }
            })
            .catch(console.error);
    }
}
