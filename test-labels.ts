import * as dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
import { instantly } from './src/lib/instantly/client'

async function test() {
    try {
        const leadEmail = 'susanw@countrysideinsinc.com' // From our previous OOO example
        console.log(`Fetching lead info for ${leadEmail}...`)

        // We need a campaign ID to fetch lead by email in some cases, or just use leads list
        const response = await (instantly as any).request(`/leads?email=${leadEmail}`)
        console.log('Lead Info:', JSON.stringify(response, null, 2))

    } catch (error) {
        console.error('Test failed:', error)
    }
}

test()
