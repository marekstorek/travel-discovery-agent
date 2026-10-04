gcloud run deploy travel-discovery-agent \
--project travel-agent-api-509920 \
--source ./backend \
--region europe-west1 \
--allow-unauthenticated \
--min-instances 0 \
--max-instances 2 \
--cpu 1 \
--memory 512Mi \
--env-vars-file ./backend/.env.yaml

gcloud run services update travel-discovery-agent \
--project travel-agent-api-509920 \
--region europe-west1 \
--env-vars-file ./backend/.env.yaml