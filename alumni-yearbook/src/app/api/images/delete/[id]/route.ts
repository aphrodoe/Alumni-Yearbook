import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import Image from '@/app/models/Image'
import dbConnect from '@/lib/mongodb'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    await dbConnect()
    
    const imageId = params.id
    
    const image = await Image.findOne({ 
      _id: imageId,
      email: session.user.email 
    })
    
    if (!image) {
      return NextResponse.json(
        { message: 'Memory not found or you do not have permission to delete it' },
        { status: 404 }
      )
    }
    
    await Image.deleteOne({ _id: imageId })
    
    return NextResponse.json(
      { message: 'Memory deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting memory:', error)
    return NextResponse.json(
      { message: 'Failed to delete memory' },
      { status: 500 }
    )
  }
}