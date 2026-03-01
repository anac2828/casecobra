'use server'
import { db } from '@/src/db'
import {
  CaseColor,
  CaseFinish,
  CaseMaterial,
  PhoneModel,
} from '@/src/generated/prisma/enums'

export type SaveConfigArgs = {
  color: CaseColor
  finish: CaseFinish
  material: CaseMaterial
  model: PhoneModel
  configId: string
}

export async function saveConfig({
  color,
  finish,
  material,
  model,
  configId,
}: SaveConfigArgs) {
  console.log('COLOR', color)
  await db.configuration.update({
    where: { id: configId },
    data: { color, finish, material, model },
  })
}
