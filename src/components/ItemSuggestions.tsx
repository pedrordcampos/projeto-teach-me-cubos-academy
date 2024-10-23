import { ComponentProps } from "react"

type ItemSuggestionsProps = ComponentProps<'button'> & {
    title: string
}

export function ItemSuggestions({title, ...props}: ItemSuggestionsProps) {
    return <button {...props}>{title}</button>
}