import { Button, ButtonProps, Image, Tooltip } from "@chakra-ui/react"
import React from "react"

type LabeledImage = {
  image: string
  label: string
}

const ReffedButton = (
  React.forwardRef<
    HTMLButtonElement,
    LabeledImage & ButtonProps
  >(
    ({ image, label, ...props }, ref) => (
      <Button {...props} {...{ ref }}>
        <Image src={image} alt={label}/>
      </Button>
    )
  )
)
ReffedButton.displayName = 'Reffed Button'

export const TooltippedButton: React.FC<
  LabeledImage & ButtonProps
> = (
  ({ label, image, ...props }) => (
    <Tooltip label="Disconnect">
      <ReffedButton
        {...{ label, image }}
        {...props}
      />
    </Tooltip>
  )
)