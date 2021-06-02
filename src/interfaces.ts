import powerbiVisualsApi from "powerbi-visuals-api";
import powerbi = powerbiVisualsApi;
import ISelectionId = powerbi.visuals.ISelectionId;

export interface ProjectTimelineSettings {
    // milestonesMarkPhases: {
    //   show: boolean;
    // };
    showLegend: {
      show: boolean;
    };
  }
  
  export interface ProjectTimelineViewModel {
    projects: ProjectTimelineRow[];
    settings: ProjectTimelineSettings;
  }
  
  export interface ProjectTimelineRow {
    projectName: string;
    pmAssignDate: Date;
    endDate: Date;
    dealSign: Date;
    dealClose: Date;
    day2: Date;
    pensDown: Date;
    error: boolean;
    activeProgram: boolean;
    selectionId: ISelectionId;
  }