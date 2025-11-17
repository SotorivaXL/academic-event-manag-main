import { useEffect, useRef, useState } from "react";
import { useKV } from "@github/spark/hooks";
import {
    Event,
    Student,
    Enrollment,
    Attendance,
    Certificate,
} from "../lib/types";
import { useEvents } from "../hooks/useEvents";
import { Tabs, TabsContent } from "./ui/tabs";
import { Dashboard } from "./Dashboard";
import { EventManagement } from "./EventManagement";
import { StudentManagement } from "./StudentManagement";
import { AttendanceTracking } from "./AttendanceTracking";
import { CertificateManagement } from "./CertificateManagement";
import { AppHeader } from "./AppHeader";
import { useAuth } from "@/contexts/AuthContext";
import { ClientManagement } from "./ClientManagement";
import { EnrollmentManagement } from "./EnrollmentManagement";
import {
    Calendar,
    Users,
    QrCode,
    Certificate as CertificateIcon,
    ChartBar,
    SignOut,
    Buildings,
    ClipboardText,
} from "@phosphor-icons/react";
import {
    Sidebar,
    SidebarItems,
    SidebarItemGroup,
    SidebarItem,
} from "flowbite-react";
import type { SidebarTheme } from "flowbite-react";

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// tipo simples para o array de items do menu
type MenuItem = {
    id: string;
    label: string;
    icon: any;
    adminOnly?: boolean;
};

export function MainApp() {
    const {
        events,
        loading: eventsLoading,
        createEvent,
        updateEvent,
        deleteEvent,
    } = useEvents();

    const { logout, user } = useAuth();

    const sidebarThemeOverrides: DeepPartial<SidebarTheme> = {
        root: {
            inner:
                "h-full overflow-y-auto overflow-x-hidden bg-[#0B1D36] py-4 text-white",
        },
        items: {
            base: "px-0",
        },
        itemGroup: {
            base: "mt-4 space-y-2 px-0 pt-4 first:mt-0 first:pt-0 border-0 first:border-0",
        },
        item: {
            base: "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10",
            active: "bg-white/10 text-white",
            collapsed: {
                insideCollapse: "",
                noIcon: "",
            },
            content: {
                base: "flex-1 whitespace-nowrap",
            },
            icon: {
                base: "h-5 w-5 shrink-0 text-white/60 transition duration-75 group-hover:text-white",
                active: "text-white",
            },
            label: "",
            listItem: "",
        },
    };

    const [students] = useKV<Student[]>("students", []);
    const [enrollments, setEnrollments] = useKV<Enrollment[]>("enrollments", []);
    const [attendances, setAttendances] = useKV<Attendance[]>("attendances", []);
    const [certificates, setCertificates] = useKV<Certificate[]>(
        "certificates",
        []
    );
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const headerRef = useRef<HTMLDivElement>(null);
    const [sidebarOffset, setSidebarOffset] = useState(0);

    const menuItems: MenuItem[] = [
        { id: "dashboard", label: "Dashboard", icon: ChartBar },
        { id: "events", label: "Eventos", icon: Calendar },
        { id: "students", label: "Alunos", icon: Users },
        { id: "enrollments", label: "Inscrições", icon: ClipboardText },
        { id: "attendance", label: "Presenças", icon: QrCode },
        { id: "certificates", label: "Certificados", icon: CertificateIcon },
        { id: "clients", label: "Clientes", icon: Buildings, adminOnly: true },
    ];

    // se não for admin e estiver na aba de clientes, volta para dashboard
    useEffect(() => {
        if (user?.role !== "admin" && activeTab === "clients") {
            setActiveTab("dashboard");
        }
    }, [user?.role, activeTab]);

    const handleEventCreate = async (
        event: Event & { workloadHours?: number }
    ) => {
        await createEvent(event);
    };

    const handleEventUpdate = async (updatedEvent: Event) => {
        await updateEvent(updatedEvent.id, updatedEvent);
    };

    const handleEventDelete = async (eventId: string) => {
        const success = await deleteEvent(eventId);
        if (success) {
            setEnrollments((current) =>
                (current || []).filter((enrollment) => enrollment.eventId !== eventId)
            );
            const enrollmentIds = (enrollments || [])
                .filter((enrollment) => enrollment.eventId === eventId)
                .map((enrollment) => enrollment.id);
            setAttendances((current) =>
                (current || []).filter(
                    (attendance) => !enrollmentIds.includes(attendance.enrollmentId)
                )
            );
            setCertificates((current) =>
                (current || []).filter(
                    (cert) => !enrollmentIds.includes(cert.enrollmentId)
                )
            );
        }
    };

    const handleEnrollmentCreate = (enrollment: Enrollment) => {
        setEnrollments((current) => [...(current || []), enrollment]);
    };

    const handleAttendanceCreate = (attendance: Attendance) => {
        setAttendances((current) => [...(current || []), attendance]);
    };

    const handleCertificateCreate = (certificate: Certificate) => {
        setCertificates((current) => [...(current || []), certificate]);
    };

    useEffect(() => {
        const updateOffset = () => {
            const height = headerRef.current?.getBoundingClientRect().height ?? 0;
            setSidebarOffset(height);
        };

        updateOffset();
        window.addEventListener("resize", updateOffset);

        let observer: ResizeObserver | undefined;
        let observedElement: HTMLDivElement | null = null;
        if (typeof ResizeObserver !== "undefined") {
            observer = new ResizeObserver(updateOffset);
            observedElement = headerRef.current;
            if (observedElement) {
                observer.observe(observedElement);
            }
        }

        return () => {
            window.removeEventListener("resize", updateOffset);
            if (observer && observedElement) {
                observer.unobserve(observedElement);
            }
            observer?.disconnect();
        };
    }, []);

    return (
        <div className="min-h-screen bg-background">
            {isSidebarOpen && (
                <div
                    className="fixed left-0 right-0 bottom-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
                    role="presentation"
                    onClick={() => setSidebarOpen(false)}
                    style={{ top: sidebarOffset }}
                />
            )}

            <Sidebar
                id="main-sidebar"
                aria-label="Navegação principal"
                className={`fixed left-0 z-40 h-screen w-64 rounded-none bg-[#0B1D36] text-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
                style={{
                    top: sidebarOffset,
                    height: `calc(100vh - ${sidebarOffset}px)`,
                }}
                theme={sidebarThemeOverrides}
            >
                <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between px-4 py-4 lg:hidden">
                        <span className="text-sm font-medium text-white/70">Menu</span>
                        <button
                            type="button"
                            className="rounded-md border border-white/20 px-2 py-1 text-xs font-medium text-white/70 transition-colors hover:bg-white/10"
                            onClick={() => setSidebarOpen(false)}
                        >
                            Fechar
                        </button>
                    </div>
                    <SidebarItems>
                        <SidebarItemGroup>
                            {menuItems
                                .filter((item) => !item.adminOnly || user?.role === "admin")
                                .map((item) => (
                                    <SidebarItem
                                        key={item.id}
                                        href="#"
                                        icon={item.icon}
                                        active={activeTab === item.id}
                                        onClick={(event) => {
                                            event.preventDefault();
                                            setActiveTab(item.id);
                                            setSidebarOpen(false);
                                        }}
                                    >
                                        {item.label}
                                    </SidebarItem>
                                ))}
                        </SidebarItemGroup>
                    </SidebarItems>

                    <div className="mt-auto border-t border-white/10">
                        <SidebarItems>
                            <SidebarItemGroup>
                                <SidebarItem
                                    href="#"
                                    icon={SignOut}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        logout();
                                        import("@/lib/toast")
                                            .then((m) =>
                                                m
                                                    .showInfo(
                                                        "Logout realizado",
                                                        "Você será redirecionado para a tela de login."
                                                    )
                                            )
                                            .catch(() => {});
                                    }}
                                >
                                    Sair
                                </SidebarItem>
                            </SidebarItemGroup>
                        </SidebarItems>
                    </div>
                </div>
            </Sidebar>

            <div className="flex min-h-screen flex-col">
                <div ref={headerRef} className="relative z-50">
                    <AppHeader />
                </div>

                <div className="flex flex-1 flex-col lg:pl-64">
                    <main className="flex-1 px-4 py-6 lg:px-8">
                        <div className="mb-6 lg:hidden">
                            <button
                                type="button"
                                aria-controls="main-sidebar"
                                aria-expanded={isSidebarOpen}
                                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card p-2 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                                onClick={() => setSidebarOpen((state) => !state)}
                            >
                                <svg
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        clipRule="evenodd"
                                        fillRule="evenodd"
                                        d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                                    ></path>
                                </svg>
                                Menu
                            </button>
                        </div>

                        <Tabs
                            value={activeTab}
                            onValueChange={setActiveTab}
                            className="space-y-6"
                        >
                            <TabsContent value="dashboard">
                                <Dashboard
                                    events={events || []}
                                    students={students || []}
                                    enrollments={enrollments || []}
                                    attendances={attendances || []}
                                    certificates={certificates || []}
                                />
                            </TabsContent>

                            <TabsContent value="events">
                                <EventManagement
                                    events={events || []}
                                    loading={eventsLoading}
                                    onEventCreate={handleEventCreate}
                                    onEventUpdate={handleEventUpdate}
                                    onEventDelete={handleEventDelete}
                                />
                            </TabsContent>

                            <TabsContent value="students">
                                <StudentManagement
                                    events={events || []}
                                    enrollments={enrollments || []}
                                    onEnrollmentCreate={handleEnrollmentCreate}
                                />
                            </TabsContent>

                            <TabsContent value="enrollments">
                                <EnrollmentManagement
                                    events={events || []}
                                />
                            </TabsContent>

                            <TabsContent value="attendance">
                                <AttendanceTracking
                                    events={events || []}
                                    students={students || []}
                                    enrollments={enrollments || []}
                                    attendances={attendances || []}
                                    onAttendanceCreate={handleAttendanceCreate}
                                />
                            </TabsContent>

                            <TabsContent value="certificates">
                                <CertificateManagement
                                    events={events || []}
                                    students={students || []}
                                    enrollments={enrollments || []}
                                    attendances={attendances || []}
                                    certificates={certificates || []}
                                    onCertificateCreate={handleCertificateCreate}
                                />
                            </TabsContent>

                            {user?.role === "admin" && (
                                <TabsContent value="clients">
                                    <ClientManagement />
                                </TabsContent>
                            )}
                        </Tabs>
                    </main>
                </div>
            </div>
        </div>
    );
}