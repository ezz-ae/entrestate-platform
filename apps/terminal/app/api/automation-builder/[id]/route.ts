import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Automation ID is required' }, { status: 400 });
    }

    const automation = await prisma.agentDefinition.findUnique({
      where: { id },
    });

    if (!automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    return NextResponse.json(automation, { status: 200 });
  } catch (error) {
    console.error('Error loading automation workflow:', error);
    return NextResponse.json({ error: 'Failed to load automation workflow' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Automation ID is required' }, { status: 400 });
    }

    await prisma.agentDefinition.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Automation deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting automation workflow:', error);
    return NextResponse.json({ error: 'Failed to delete automation workflow' }, { status: 500 });
  }
}
