// Simplified useToast hook for build pass
import * as React from "react"

export const useToast = () => {
    return {
        toast: (props: any) => {
            console.log("Toast:", props)
        },
        dismiss: (id?: string) => { },
        toasts: []
    }
}
