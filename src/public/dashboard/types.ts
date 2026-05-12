export interface VisitPerHour {
    hour: string;
    count: number;
}

export interface Customer {
    id: string;
    visitCount: number;
    treesPlanted: number;
    lastConnectionAt: string;
}
