import createPushNotificationsJobs from "./8-job";
import kue from "kue"
import { expect } from "chai"


describe('createPushNotificationsJobs', () => {
    let queue;

    before(() => {    
        queue = kue.createQueue()
        queue.testMode.enter()
    })

    afterEach(() => {
        queue.testMode.clear()
    })

    after(() => {
        queue.testMode.exit()
    })

    it('should throw an error if jobs is not an array', () => {
        expect(() => createPushNotificationsJobs({}, queue)).to.
        throw(Error, 'Jobs is not an array')
    })

    it('should create jobs in the queue', () => {
        const jobs = [
            { phoneNumber: '4153518780', message: 'This is the code 1234' },
            { phoneNumber: '4153518781', message: 'This is the code 5678' },
        ];

        createPushNotificationsJobs(jobs, queue)

        const newJob = queue.testMode.jobs
        expect(newJob).to.have.lengthOf(2);
        expect(newJob[0].data).to.deep.include(jobs[0])
        expect(newJob[1].data).to.deep.include(jobs[1])

    })
})
