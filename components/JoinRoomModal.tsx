import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { QRCodeCanvas } from "qrcode.react"
import { ReactNode, useState } from "react"

interface JoinRoomModalProps {
    roomCode: string | null
    /** Dialog is portaled to body; match timer dark mode explicitly */
    timerDark?: boolean
    children: ReactNode
}

export default function JoinRoomModal({
    roomCode,
    timerDark = false,
    children,
}: JoinRoomModalProps) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>

            <DialogContent
                className={cn(
                    "flex flex-col items-center justify-center p-10 gap-8",
                    timerDark &&
                        "border-white/[0.08] bg-zinc-950/95 text-zinc-200 shadow-2xl shadow-black/40 backdrop-blur-xl",
                )}
            >
                <QRCodeCanvas
                    value={`${process.env.NEXT_PUBLIC_APP_URL}/dune-imperium/controller?roomCode=${roomCode}`}
                    size={250}
                    bgColor="transparent"
                    fgColor={timerDark ? "#c4b5a3" : "#4f3914"}
                    level="M"
                />
                <p className={cn("font-medium", timerDark ? "text-zinc-400" : "text-amber-900")}>
                    Scan the QR Code to join the room.
                </p>
            </DialogContent>
        </Dialog>
    )
}
