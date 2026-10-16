export const BLOCK_TYPES = [
  { id: "work", label: "Travail" },
  { id: "study", label: "Cours / apprentissage" },
  { id: "sport", label: "Sport" },
  { id: "personal", label: "Perso" },
  { id: "admin", label: "Admin / courses" },
  { id: "custom", label: "Libellé libre" },
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number]["id"];

export const INTENSITIES = [
  { id: "light", label: "Légère" },
  { id: "moderate", label: "Modérée" },
  { id: "hard", label: "Intense" },
] as const;

export type Intensity = (typeof INTENSITIES)[number]["id"];

export type BlockView = {
  key: string;
  title: string;
  startMinute: number;
  endMinute: number;
  blockType: BlockType;
  customLabel: string | null;
  origin: "rule" | "exception" | "oneoff";
  ruleId: string | null;
  oneOffId: string | null;
};

export type ScheduleRule = {
  id: string;
  weekday: number;
  title: string;
  start_minute: number;
  end_minute: number;
  block_type: BlockType;
  custom_label: string | null;
};

export type ScheduleException = {
  id: string;
  rule_id: string;
  occurrence_date: string;
  cancelled: boolean;
  title: string | null;
  start_minute: number | null;
  end_minute: number | null;
  block_type: BlockType | null;
  custom_label: string | null;
};

export type ScheduleOneOff = {
  id: string;
  title: string;
  start_minute: number;
  end_minute: number;
  block_type: BlockType;
  custom_label: string | null;
};

export function blockLabel(type: BlockType, customLabel: string | null): string {
  if (type === "custom") return customLabel || "Libre";
  return BLOCK_TYPES.find((item) => item.id === type)?.label ?? type;
}

export function materializeDay(
  weekday: number,
  rules: ScheduleRule[],
  exceptions: ScheduleException[],
  oneOffs: ScheduleOneOff[],
): BlockView[] {
  const exceptionByRule = new Map(exceptions.map((item) => [item.rule_id, item]));
  const blocks: BlockView[] = [];

  for (const rule of rules) {
    if (rule.weekday !== weekday) continue;
    const exception = exceptionByRule.get(rule.id);
    if (exception?.cancelled) continue;
    if (
      exception &&
      exception.title &&
      exception.start_minute != null &&
      exception.end_minute != null &&
      exception.block_type
    ) {
      blocks.push({
        key: `exception-${exception.id}`,
        title: exception.title,
        startMinute: exception.start_minute,
        endMinute: exception.end_minute,
        blockType: exception.block_type,
        customLabel: exception.custom_label,
        origin: "exception",
        ruleId: rule.id,
        oneOffId: null,
      });
      continue;
    }
    blocks.push({
      key: `rule-${rule.id}`,
      title: rule.title,
      startMinute: rule.start_minute,
      endMinute: rule.end_minute,
      blockType: rule.block_type,
      customLabel: rule.custom_label,
      origin: "rule",
      ruleId: rule.id,
      oneOffId: null,
    });
  }

  for (const oneOff of oneOffs) {
    blocks.push({
      key: `oneoff-${oneOff.id}`,
      title: oneOff.title,
      startMinute: oneOff.start_minute,
      endMinute: oneOff.end_minute,
      blockType: oneOff.block_type,
      customLabel: oneOff.custom_label,
      origin: "oneoff",
      ruleId: null,
      oneOffId: oneOff.id,
    });
  }

  return blocks.sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute);
}

export type PositionedBlock = BlockView & { column: number; columns: number };

export function layoutBlocks(blocks: BlockView[]): PositionedBlock[] {
  const sorted = [...blocks].sort(
    (a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute,
  );
  const positioned: PositionedBlock[] = [];
  let cluster: BlockView[] = [];
  let clusterEnd = -1;

  const flush = () => {
    if (!cluster.length) return;
    const columnEnds: number[] = [];
    const placed: { block: BlockView; column: number }[] = [];
    for (const block of cluster) {
      let column = columnEnds.findIndex((end) => end <= block.startMinute);
      if (column === -1) {
        column = columnEnds.length;
        columnEnds.push(block.endMinute);
      } else {
        columnEnds[column] = block.endMinute;
      }
      placed.push({ block, column });
    }
    for (const item of placed) {
      positioned.push({ ...item.block, column: item.column, columns: columnEnds.length });
    }
    cluster = [];
    clusterEnd = -1;
  };

  for (const block of sorted) {
    if (cluster.length && block.startMinute >= clusterEnd) flush();
    cluster.push(block);
    clusterEnd = Math.max(clusterEnd, block.endMinute);
  }
  flush();
  return positioned;
}
