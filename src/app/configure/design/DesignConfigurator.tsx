'use client'
import NextImage from 'next/image'
import { toast } from 'sonner'
import { ArrowRight, Check, ChevronsUpDown } from 'lucide-react'
import { Description, Radio, RadioGroup } from '@headlessui/react'
import { Rnd } from 'react-rnd'
import { useRef, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import ImageHandles from '@/src/components/ImageHandles'
import { cn, formatPrice } from '@/src/lib/utils'
import { useUploadThing } from '@/src/lib/uploadthing'
import {
  COLORS,
  FINISHES,
  MATERIALS,
  MODELS,
} from '@/src/validators/option-validator'
import { BASE_PRICE } from '@/src/config/products'
import { useMutation } from '@tanstack/react-query'
import { saveConfig as saveCaseConfig, SaveConfigArgs } from './actions'
import { useRouter } from 'next/navigation'

// ** PROPS **
interface DesignConfiguratorProps {
  configId: string
  imageUrl: string
  imageDimensions: {
    width: number
    height: number
  }
}

// ** COMPONENT DISPLAYS IN page.tsx**
export default function DesignConfigurator({
  configId,
  imageUrl,
  imageDimensions,
}: DesignConfiguratorProps) {
  // ** HOOKS **
  // Will upload the cropped image to the server and save it in the database when the user clicks the continue button
  const { startUpload } = useUploadThing('imageUploader')
  const router = useRouter()
  // saveConfig will save the configurations selected by the user in the database.
  const { mutate: saveConfig } = useMutation({
    mutationKey: ['save-config'], // key to identify the mutation - can be used for caching and invalidating the mutation
    mutationFn: async (args: SaveConfigArgs) => {
      await Promise.all([saveImgConfiguration(), saveCaseConfig(args)])
    },
    onError: () => {
      toast.error('Something went wrong', {
        description: 'There was an error on our end, please try again.',
        position: 'top-center',
      })
    },
    onSuccess: () => router.push(`/configure/preview?id=${configId}`),
  })

  // **** LOCAL STATE HOOKS ****
  // Default state color is black and default state model is iphone x
  const [options, setOptions] = useState<{
    color: (typeof COLORS)[number]
    model: (typeof MODELS.options)[number]
    material: (typeof MATERIALS.options)[number]
    finish: (typeof FINISHES.options)[number]
  }>({
    color: COLORS[0],
    model: MODELS.options[0],
    material: MATERIALS.options[0],
    finish: FINISHES.options[0],
  })

  // Numbers are from RND component
  // Divide the image dimensions by 4 to make the initial rendered image smaller and fit better in the container
  const [renderedDimension, setRenderedDimension] = useState({
    width: imageDimensions.width / 4,
    height: imageDimensions.height / 4,
  })

  //X and Y coordinates of the rendered image - default is to be placed in the middle of the phone template
  const [renderedPosition, setRenderedPosition] = useState({ x: 150, y: 205 })

  // ** REFS **
  const phoneCaseRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ** FUNCTIONS **
  async function saveImgConfiguration() {
    try {
      // 1 Get coordinates of the phone case template to calculate the position of the rendered image in relation to the template
      // phoneCaseref.current! means that we are sure that the ref is not null
      // Width and height are the iphone template dimensions and top and left distance from the top left corner of the AspectRation component
      const {
        left: caseLeft,
        top: caseTop,
        width,
        height,
      } = phoneCaseRef.current!.getBoundingClientRect()

      // 2 Get coordinates of the LEFT main container
      const { left: containerLeft, top: containerTop } =
        containerRef.current!.getBoundingClientRect()

      // 3 Calculate the offsets of the phone template in relation to the main container
      const leftOffset = caseLeft - containerLeft
      const topOffset = caseTop - containerTop

      //4 will determine the postion of the rendered image in relation to the phone template by subtracting the offsets from the rendered position
      const actualX = renderedPosition.x - leftOffset
      const actualY = renderedPosition.y - topOffset

      //5 Draw canvas. Canvas represents the phone template. Width and height are the same as the phone template dimensions.
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      // 6 Create a context for the canvas to be able to draw on it.
      const ctx = canvas.getContext('2d')!

      // Creates a new image element <img/>
      const userImage = new Image()
      userImage.crossOrigin = 'anonymous' // to avoid CORS issues when exporting the canvas as an image
      userImage.src = imageUrl

      // Waiting until the image is loaded from imageUrl. "Resolve" is a function that is called when the image is loaded.
      await new Promise((resolve) => (userImage.onload = resolve))

      // Image that will be drawn on the canvas is the user uploaded image and it will be drawn in the position and dimensions determined by the RND component
      ctx?.drawImage(
        userImage,
        actualX,
        actualY,
        renderedDimension.width,
        renderedDimension.height,
      )

      const base64 = canvas.toDataURL() // will give us the image in base64 format that we can save in the database
      const base64Data = base64.split(',')[1] // remove the data:image/png;base64 part

      // convert the base64 string to a blob to be able to save it in the database as an image file
      const blob = base64ToBlob(base64Data, 'image/png')
      const file = new File([blob], 'filename.png', { type: 'image/png' })

      await startUpload([file], { configId })
    } catch (err) {
      console.log(err)
      toast.error('Something went wrong', {
        position: 'top-center',
        description:
          'There was a problem saving your config, please try again.',
      })
    }
  }

  function base64ToBlob(base64: string, mimeType: string) {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }

    // This is so that we can save the image in the database as a blob and not as a base64 string which would take up more space and would not be efficient for storage and retrieval
    const byteArray = new Uint8Array(byteNumbers)

    return new Blob([byteArray], { type: mimeType })
  }

  //** RENDERED COMPONENT*/

  return (
    <div className='relative mt-20 grid grid-cols-1 lg:grid-cols-3 mb-20 pb-20'>
      {/* LEFT SIDE - Uploaded picture section */}
      <div
        ref={containerRef}
        className='relative h-150 overflow-hidden col-span-2 w-full max-w-4xl flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
      >
        <div className='relative w-60 bg-opacity-50 pointer-events-none aspect-896/1931'>
          {/* Aspect ration component is to keep the iphone image from getting distorted */}
          <AspectRatio
            ref={phoneCaseRef}
            ratio={896 / 1931}
            className='pointer-events-none relative z-50 aspect-896/1931 w-full'
          >
            <NextImage
              fill
              alt='phone image'
              src='/phone-template.png'
              className='pointer-events-none z-50 select-none'
            />
          </AspectRatio>
          <div className='absolute z-40 inset-0 left-0.75 top-px right-0.75 bottom-px rounded-[32px] shadow-[0_0_0_99999px_rgba(229,231,235,0.6)]' />
          <div
            className={cn(
              'absolute inset-0 left-0.75 top-px right-0.75 bottom-px rounded-[32px]',
              `bg-${options.color.tw}`,
            )}
          />
        </div>
        {/* Rnd will keep the image in proportion when it is resized */}
        <Rnd
          default={{
            x: 150,
            y: 205,
            height: imageDimensions.height / 4,
            width: imageDimensions.width / 4,
          }}
          onResizeStop={(_, __, ref, ___, { x, y }) => {
            setRenderedDimension({
              height: parseInt(ref.style.height.slice(0, -2)),
              width: parseInt(ref.style.width.slice(0, -2)),
            })

            setRenderedPosition({ x, y })
          }}
          onDragStop={(_, data) => {
            const { x, y } = data
            setRenderedPosition({ x, y })
          }}
          lockAspectRatio
          resizeHandleComponent={{
            bottomRight: <ImageHandles />,
            bottomLeft: <ImageHandles />,
            topRight: <ImageHandles />,
            topLeft: <ImageHandles />,
          }}
        >
          {/* Image uploaded by user */}
          <div className='relative w-full h-full'>
            <NextImage
              src={imageUrl}
              fill
              alt='your image'
              className='pointer-events-none'
            />
          </div>
        </Rnd>
      </div>

      {/* Right scroll section */}
      <div className='h-150 w-full col-span-full lg:col-span-1 flex flex-col bg-white'>
        <ScrollArea className='relative flex-1 overflow-auto'>
          {/* White gradient starts from the bottom */}
          <div
            aria-hidden='true'
            className='absolute z-10 inset-x-0 bottom-0 h-12 bg-linear-to-t from-white pointer-events-none'
          />
          {/* Case Customization */}
          <div className='px-8 pb-12 pt-8'>
            <h2 className='tracking-tight font-bold text-3xl'>
              Customize your case
            </h2>
            {/* Divider */}
            <div className='w-full h-px bg-zinc-200 my-6' />
            {/* Color picker */}
            <div className='relative mt-4 h-full flex flex-col justify-between'>
              {/* Space between color selector and model */}
              <div className='flex flex-col gap-6'>
                {/* When the 'Radio' button is clicked the value returned is the new color object selected  */}
                <RadioGroup
                  value={options.color}
                  onChange={(val) =>
                    // UPDATES COLOR IN STATE
                    // val comes from the value returned in the Radio element
                    setOptions((prev) => ({ ...prev, color: val }))
                  }
                >
                  {/******* Color label *******/}
                  <Label>Color: {options.color.label}</Label>
                  {/* Ratio button container */}
                  <div className='mt-3 flex items-center gap-1 space-x-3'>
                    {COLORS.map((color) => (
                      <Radio
                        key={color.label}
                        value={color}
                        className={({ focus, checked }) =>
                          cn(
                            'relative -m-0.5 flex cursor-pointer items-center justify-center rounded-full p-0.5 active:ring-0 focus:ring-0 active:outline-none focus:outline-none border-2 border-transparent',
                            { [`border-${color.tw}`]: focus || checked },
                          )
                        }
                      >
                        <span
                          className={cn(
                            `bg-${color.tw}`,
                            'h-8 w-8 rounded-full border border-black border-opacity-10',
                          )}
                        ></span>
                      </Radio>
                    ))}
                  </div>
                </RadioGroup>

                {/****** Phone model selector *******/}
                <div className='relative flex flex-col gap-3 w-full'>
                  <Label>Model</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='outline'
                        role='combobox'
                        className='w-full justify-between'
                      >
                        {/* current option in state */}
                        {options.model.label}
                        <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {MODELS.options.map((model) => (
                        <DropdownMenuItem
                          key={model.label}
                          onClick={() =>
                            // UPDATES MODEL IN STATE
                            setOptions((prev) => ({ ...prev, model }))
                          }
                          className={cn(
                            'flex text-sm gap-1 items-center p-1.5 cursor-default hover:bg-zinc-100',
                            // highlight the currently selected model
                            {
                              'bg-zinc-100':
                                model.label === options.model.label,
                            },
                          )}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              // Check mark is visible only for the currently selected model
                              model.label === options.model.label
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                          {model.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {/* ****** MATERIAL AND FINISH ****** */}
                {/* Will map over both MATERIALS and FINISHES since it has the same structure */}
                {[MATERIALS, FINISHES].map(
                  ({ name, options: selectableOptions }) => (
                    <RadioGroup
                      key={name}
                      // value from the state - material of finish
                      value={options[name]}
                      // Update material or finish in state
                      onChange={(val) =>
                        setOptions((prev) => ({ ...prev, [name]: val }))
                      }
                    >
                      <Label className='mb-2'>
                        {/* Will capitalize the first letter of the name */}
                        {name.slice(0, 1).toLocaleUpperCase() + name.slice(1)}
                      </Label>
                      <div className='mt-3 space-y-4'>
                        {selectableOptions.map((option) => (
                          <Radio
                            key={option.value}
                            value={option}
                            className={({ focus, checked }) =>
                              cn(
                                'relative block cursor-pointer rounded-lg bg-white px-6 py-4 shadow-sm border-2 border-zinc-200 focus:outline-none ring-0 focus:ring-0 outline-none sm:flex sm:justify-between',
                                {
                                  'border-primary': focus || checked,
                                },
                              )
                            }
                          >
                            <span className='flex items-center'>
                              <span className='flex flex-col text-sm'>
                                <Label className='font-medium text-gray-900'>
                                  {option.label}
                                </Label>
                                {option.description ? (
                                  <Description
                                    as='span'
                                    className='text-gray-500'
                                  >
                                    <span className='block sm:inline'>
                                      {option.description}
                                    </span>
                                  </Description>
                                ) : null}
                              </span>
                            </span>
                            <Description
                              as='span'
                              className='mt-2 flex text-sm sm:ml-4 sm:mt-0 sm:flex-col sm:text-right'
                            >
                              <span className='font-medium text-gray-900'>
                                {formatPrice(option.price / 100)}
                              </span>
                            </Description>
                          </Radio>
                        ))}
                      </div>
                    </RadioGroup>
                  ),
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className='w-full px-8 h-16 bg-white'>
          <div className='h-px w-full bg-zinc-200' />
          <div className='w-full h-full flex justify-end items-center'>
            <div className='w-full flex gap-6 items-center'>
              <p className='font-medium whitespace-nowrap'>
                {formatPrice(
                  (BASE_PRICE + options.finish.price + options.material.price) /
                    100,
                )}
              </p>
              <Button
                className='w-full shrink'
                size='sm'
                onClick={() =>
                  saveConfig({
                    configId,
                    color: options.color.value,
                    model: options.model.value,
                    material: options.material.value,
                    finish: options.finish.value,
                  })
                }
              >
                Continue <ArrowRight className='h-4 w-4 ml-1.5 inline' />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
