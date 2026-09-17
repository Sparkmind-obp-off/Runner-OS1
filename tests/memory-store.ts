import type { RunStore } from '../src/application/ports'
import type { EventEvidence, IntegrationAccount, RecurringActivity, RecurringOccurrence, Run, RunEvent, RunnerProfile, RunningActivity, RunningEvent, Session, User } from '../src/domain/models'

export class MemoryRunStore implements RunStore {
  users=new Map<string,User>(); sessions=new Map<string,Session>(); runs=new Map<string,Run>(); events:RunEvent[]=[]
  profiles=new Map<string,RunnerProfile>(); recurring=new Map<string,RecurringActivity>(); occurrences=new Map<string,RecurringOccurrence>(); activities=new Map<string,RunningActivity>(); runningEvents=new Map<string,RunningEvent>(); evidence:EventEvidence[]=[]; integrations=new Map<string,IntegrationAccount>()
  failNextTransactionalWrite=false
  async createUser(u:User){if([...this.users.values()].some(x=>x.email.toLowerCase()===u.email.toLowerCase()))throw new Error('unique');this.users.set(u.id,clone(u))}
  async findUserByEmail(e:string){return cloneOrNull([...this.users.values()].find(u=>u.email.toLowerCase()===e.toLowerCase())??null)}
  async findUserById(id:string){return cloneOrNull(this.users.get(id)??null)}
  async createSession(s:Session){this.sessions.set(s.tokenHash,clone(s))}
  async findSessionByTokenHash(h:string){return cloneOrNull(this.sessions.get(h)??null)}
  async deleteSessionByTokenHash(h:string){this.sessions.delete(h)}
  async deleteExpiredSessions(now:string){for(const[k,s]of this.sessions)if(s.expiresAt<=now)this.sessions.delete(k)}
  async createRunWithEvent(r:Run,e:RunEvent){this.commit(r,e,true)}
  async getRun(o:string,id:string){const r=this.runs.get(id);return cloneOrNull(r?.ownerId===o?r:null)}
  async listRuns(o:string){return [...this.runs.values()].filter(x=>x.ownerId===o).map(clone)}
  async saveRunWithEvent(r:Run,e:RunEvent){this.commit(r,e,false)}
  async listEvents(o:string,id:string){return this.events.filter(x=>x.ownerId===o&&x.runId===id).map(clone).reverse()}
  async listRecentEvents(o:string,l:number){return this.events.filter(x=>x.ownerId===o).map(clone).reverse().slice(0,l)}
  async getProfile(o:string){return cloneOrNull(this.profiles.get(o)??null)}
  async saveProfile(p:RunnerProfile){this.profiles.set(p.ownerId,clone(p))}
  async listRecurringActivities(o:string){return [...this.recurring.values()].filter(x=>x.ownerId===o).map(clone)}
  async getRecurringActivity(o:string,id:string){const x=this.recurring.get(id);return cloneOrNull(x?.ownerId===o?x:null)}
  async saveRecurringActivity(x:RecurringActivity){this.recurring.set(x.id,clone(x))}
  async listOccurrences(o:string,from?:string,to?:string){return [...this.occurrences.values()].filter(x=>x.ownerId===o&&(!from||x.scheduledAt>=from)&&(!to||x.scheduledAt<=to)).map(clone)}
  async saveOccurrence(x:RecurringOccurrence){const old=[...this.occurrences.values()].find(y=>y.ownerId===x.ownerId&&y.recurringActivityId===x.recurringActivityId&&y.scheduledAt===x.scheduledAt);this.occurrences.set(old?.id??x.id,clone({...x,id:old?.id??x.id}))}
  async listRunningActivities(o:string){return [...this.activities.values()].filter(x=>x.ownerId===o).sort((a,b)=>b.startedAt.localeCompare(a.startedAt)).map(clone)}
  async getRunningActivity(o:string,id:string){const x=this.activities.get(id);return cloneOrNull(x?.ownerId===o?x:null)}
  async findRunningActivityByExternalId(o:string,s:string,e:string){return cloneOrNull([...this.activities.values()].find(x=>x.ownerId===o&&x.source===s&&x.externalId===e)??null)}
  async saveRunningActivity(x:RunningActivity){this.activities.set(x.id,clone(x))}
  async listRunningEvents(o:string){return [...this.runningEvents.values()].filter(x=>x.ownerId===o).map(clone)}
  async getRunningEvent(o:string,id:string){const x=this.runningEvents.get(id);return cloneOrNull(x?.ownerId===o?x:null)}
  async saveRunningEvent(x:RunningEvent){this.runningEvents.set(x.id,clone(x))}
  async listEventEvidence(o:string,id:string){return this.evidence.filter(x=>x.ownerId===o&&x.eventId===id).map(clone)}
  async saveEventEvidence(x:EventEvidence){this.evidence.push(clone(x))}
  async getIntegration(o:string,p:'strava'){return cloneOrNull(this.integrations.get(`${o}:${p}`)??null)}
  async saveIntegration(x:IntegrationAccount){this.integrations.set(`${x.ownerId}:${x.provider}`,clone(x))}
  private commit(r:Run,e:RunEvent,creating:boolean){if(this.failNextTransactionalWrite){this.failNextTransactionalWrite=false;throw new Error('simulated transaction failure')}if(!creating&&!this.runs.has(r.id))throw new Error('missing run');this.runs.set(r.id,clone(r));this.events.push(clone(e))}
}
const clone=<T>(v:T):T=>structuredClone(v)
const cloneOrNull=<T>(v:T|null):T|null=>v===null?null:clone(v)
