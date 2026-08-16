import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AgentRole, CompanyType } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const { id, name, teamId, nodes, edges, role, market, companyType, inputs, rules, outputs, connectors } = await req.json();

    if (!name || !teamId || !nodes || !edges || !role || !market || !companyType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const workflowGraph = { nodes, edges };

    let automation;
    if (id) {
      // Update existing automation
      automation = await prisma.agentDefinition.update({
        where: { id },
        data: {
          name,
          role,
          market,
          companyType,
          inputs: inputs || {},
          rules: rules || {},
          outputs: outputs || {},
          connectors: connectors || {},
          workflowGraph: workflowGraph as any,
        },
      });
    } else {
      // Create new automation
      automation = await prisma.agentDefinition.create({
        data: {
          name,
          teamId,
          role,
          market,
          companyType,
          inputs: inputs || {},
          rules: rules || {},
          outputs: outputs || {},
          connectors: connectors || {},
          workflowGraph: workflowGraph as any,
        },
      });
    }

    return NextResponse.json(automation, { status: 200 });
  } catch (error) {
    console.error('Error saving automation workflow:', error);
    return NextResponse.json({ error: 'Failed to save automation workflow' }, { status: 500 });
  }
}
