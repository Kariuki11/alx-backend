

export default function createPushNotificationsJobs(jobs, queue) {
    if (!Array.isArray(jobs)) {
        throw Error('Jobs is not an array');
    }
    jobs.forEach(job => {
        const newJob = queue.create("push_notification_code_3", job)
        newJob.save((err) => {
            if (!err) {
                console.log(`Notification job created: ${newJob.id}`)
            }
        })

        newJob.on("complete", () => {
            console.log(`Notification job ${newJob.id} completed`)
        })
        
        newJob.on("failed", (err) => {
            console.log(`Notification job ${newJob.id} failed: ${err}`)
        })

        newJob.on("progress", (percentage) => {
            console.log(`Notification job ${newJob.id} ${percentage}% complete`)
        })
    });
}
