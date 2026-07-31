import os
from typing import Optional

from azure.ai.agents.models import (
    CodeInterpreterTool,
    FilePurpose,
    MessageAttachment,
    ThreadMessage,
)
from azure.ai.agents.models._models import ThreadRun
from azure.ai.projects import AIProjectClient
from azure.core.paging import ItemPaged
from azure.identity import DefaultAzureCredential

project_client = AIProjectClient(
    endpoint=os.environ["AZURE_AI_FOUNDRY_PROJECT_ENDPOINT"],
    credential=DefaultAzureCredential(),
)

code_interpreter = CodeInterpreterTool()


class AIProjectRepository:
    def __init__(self):
        pass

    def create_agent(self) -> str:
        agent = project_client.agents.create_agent(
            model=os.environ["AGENT_DEPLOYMENT_NAME"],
            name="DataAnalysisAgent",
            instructions="You are helpful agent.",
            tools=code_interpreter.definitions,
            tool_resources=code_interpreter.resources,
        )
        return agent.id

    def upload_file(self, file_path: str) -> str:
        file = project_client.agents.files.upload_and_poll(
            file_path=file_path,
            purpose=FilePurpose.AGENTS,
        )
        return file.id

    def create_thread(self) -> str:
        thread = project_client.agents.threads.create()
        return thread.id

    def create_message(
        self, thread_id: str, role: str, content: str, file_id: Optional[str] = None
    ) -> str:
        if file_id:
            attachment = MessageAttachment(
                file_id=file_id, tools=code_interpreter.definitions
            )
            message = project_client.agents.messages.create(
                thread_id=thread_id,
                role=role,
                content=content,
                attachments=[attachment],
            )
        else:
            message = project_client.agents.messages.create(
                thread_id=thread_id, role=role, content=content
            )
        return message.id

    def run_agent(self, agent_id: str, thread_id: str) -> ThreadRun:
        run = project_client.agents.runs.create_and_process(
            agent_id=agent_id, thread_id=thread_id
        )
        return run

    def get_thread(self, thread_id: str) -> ItemPaged[ThreadMessage]:
        messages = project_client.agents.messages.list(thread_id=thread_id)
        return messages

    def save_file(self, file_id: str, file_name: str, target_dir: str) -> None:
        project_client.agents.files.save(
            file_id=file_id, file_name=file_name, target_dir=target_dir
        )

    def delete_file(self, file_id: str) -> None:
        project_client.agents.files.delete(file_id=file_id)

    def delete_agent(self, agent_id: str) -> None:
        project_client.agents.delete_agent(agent_id=agent_id)
