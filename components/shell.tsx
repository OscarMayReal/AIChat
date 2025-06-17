import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { Allotment } from "allotment";
import { useState } from "react";

export function Shell({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    return (
        <>
            <Header sidebarOpen={[sidebarOpen, setSidebarOpen]}/>
            <div style={{
                height: "calc(100vh - 50px)",
                width: "100%",
            }}>
                <Allotment separator={false}>
                    <Allotment.Pane minSize={250} preferredSize={300} snap={true} visible={sidebarOpen}>
                        <Sidebar />
                    </Allotment.Pane>
                    <Allotment.Pane>
                        {children}
                    </Allotment.Pane>
                </Allotment>
            </div>
        </>
    )
}